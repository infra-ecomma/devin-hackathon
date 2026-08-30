// Plan loading for the Earned Light engine. Never throws: every parse or shape
// defect becomes a human-readable problem string, and the returned plan is the
// normalized survivor of validation, never the raw input.
import * as fs from "fs";
import * as path from "path";
import { CheckSpec, FeaturePlan, ProductPlan, VenturePlan } from "../../types";

const CATEGORIES: ReadonlyArray<ProductPlan["category"]> = [
  "api", "frontend", "database", "infra", "ml", "auth", "default"
];

export function loadPlan(root: string): { plan: VenturePlan | null; problems: string[]; planPath: string } {
  const planPath = path.join(root, ".tellurion", "plan.json");
  const problems: string[] = [];

  let raw: string;
  try {
    raw = fs.readFileSync(planPath, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    problems.push(code === "ENOENT"
      ? `no plan found at ${planPath}`
      : `plan at ${planPath} could not be read: ${message(err)}`);
    return { plan: null, problems, planPath };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch (err) {
    problems.push(`plan at ${planPath} is not valid JSON: ${message(err)}`);
    return { plan: null, problems, planPath };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    problems.push(`plan at ${planPath} must be a JSON object`);
    return { plan: null, problems, planPath };
  }
  const rawPlan = parsed as Record<string, unknown>;

  let name = "";
  if (typeof rawPlan.name === "string" && rawPlan.name.trim() !== "") {
    name = rawPlan.name;
  } else {
    problems.push("plan name must be a non-empty string");
  }

  if (!Array.isArray(rawPlan.products)) {
    problems.push("plan products must be an array");
    return { plan: null, problems, planPath };
  }

  const products: ProductPlan[] = [];
  const productIds = new Set<string>();
  rawPlan.products.forEach((entry, i) => {
    const product = parseProduct(entry, i, productIds, problems);
    if (product !== null) products.push(product);
  });

  return { plan: { name, products }, problems, planPath };
}

function parseProduct(
  entry: unknown,
  index: number,
  seenIds: Set<string>,
  problems: string[]
): ProductPlan | null {
  const where = `products[${index}]`;
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    problems.push(`${where} must be an object, entry dropped`);
    return null;
  }
  const rawProduct = entry as Record<string, unknown>;

  const id = readId(rawProduct.id);
  if (id === null) {
    problems.push(`${where} needs a usable id (non-empty, no slash, not __walk__), entry dropped`);
    return null;
  }
  if (seenIds.has(id)) {
    problems.push(`${where} duplicates product id "${id}", entry dropped`);
    return null;
  }
  seenIds.add(id);

  let name = id;
  if (typeof rawProduct.name === "string" && rawProduct.name.trim() !== "") {
    name = rawProduct.name;
  } else {
    problems.push(`product "${id}" name must be a non-empty string, using its id`);
  }

  let category: ProductPlan["category"] = "default";
  const rawCategory = rawProduct.category;
  if (typeof rawCategory === "string" && (CATEGORIES as readonly string[]).includes(rawCategory)) {
    category = rawCategory as ProductPlan["category"];
  } else {
    problems.push(rawCategory === undefined
      ? `product "${id}" has no category, using "default"`
      : `product "${id}" category ${JSON.stringify(rawCategory)} is not recognized, using "default"`);
  }

  const features: FeaturePlan[] = [];
  if (!Array.isArray(rawProduct.features)) {
    problems.push(`product "${id}" features must be an array`);
  } else {
    const featureIds = new Set<string>();
    rawProduct.features.forEach((featureEntry, j) => {
      const feature = parseFeature(featureEntry, j, id, featureIds, problems);
      if (feature !== null) features.push(feature);
    });
  }

  const walk = parseCheckSpec(rawProduct.walk, `product "${id}" walk`, problems);
  const product: ProductPlan = { id, name, category, features };
  if (walk !== undefined) product.walk = walk;
  return product;
}

function parseFeature(
  entry: unknown,
  index: number,
  productId: string,
  seenIds: Set<string>,
  problems: string[]
): FeaturePlan | null {
  const where = `product "${productId}" features[${index}]`;
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    problems.push(`${where} must be an object, entry dropped`);
    return null;
  }
  const rawFeature = entry as Record<string, unknown>;

  const id = readId(rawFeature.id);
  if (id === null) {
    problems.push(`${where} needs a usable id (non-empty, no slash, not __walk__), entry dropped`);
    return null;
  }
  if (seenIds.has(id)) {
    problems.push(`${where} duplicates feature id "${id}", entry dropped`);
    return null;
  }
  seenIds.add(id);

  const label = `feature "${productId}/${id}"`;
  let name = id;
  if (typeof rawFeature.name === "string" && rawFeature.name.trim() !== "") {
    name = rawFeature.name;
  } else {
    problems.push(`${label} name must be a non-empty string, using its id`);
  }

  const paths: string[] = [];
  const rawPaths = rawFeature.paths;
  if (!Array.isArray(rawPaths) || rawPaths.length === 0) {
    problems.push(`${label} needs a non-empty paths array of strings`);
  } else {
    rawPaths.forEach((p, k) => {
      if (typeof p !== "string") {
        problems.push(`${label} paths[${k}] must be a string, entry dropped`);
        return;
      }
      const normalized = normalizePath(p);
      if (normalized === "") {
        problems.push(`${label} paths[${k}] normalizes to empty, entry dropped`);
        return;
      }
      paths.push(normalized);
    });
    if (paths.length === 0) {
      problems.push(`${label} has no usable paths left`);
    }
  }

  const check = parseCheckSpec(rawFeature.check, `${label} check`, problems);
  const feature: FeaturePlan = { id, name, paths };
  if (check !== undefined) feature.check = check;
  return feature;
}

function parseCheckSpec(value: unknown, owner: string, problems: string[]): CheckSpec | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    problems.push(`${owner} must be an object with a command, ignored`);
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.command !== "string" || record.command.trim() === "") {
    problems.push(`${owner} command must be a non-empty string, ignored`);
    return undefined;
  }
  const spec: CheckSpec = { command: record.command };
  if (typeof record.timeoutMs === "number" && Number.isFinite(record.timeoutMs) && record.timeoutMs > 0) {
    spec.timeoutMs = record.timeoutMs;
  }
  return spec;
}

function readId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  // "/" would split the evidence target key, and "__walk__" is the reserved
  // target of the product walk; both would silently collide with real records.
  if (value.includes("/") || value === "__walk__") return null;
  return value;
}

function normalizePath(p: string): string {
  let out = p.replace(/\\/g, "/");
  while (out.startsWith("./")) out = out.slice(2);
  while (out.endsWith("/") && out !== "/") out = out.slice(0, -1);
  return out;
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
