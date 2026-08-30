// Pure derivation of the sky from plan, git facts, and recorded evidence.
// No IO here. Verified is never assigned; it can only fall out of a recorded
// exit 0 whose sha still covers every commit on the feature's paths.
import {
  EvidenceRecord,
  FeaturePlan,
  FeatureView,
  ProductPlan,
  ProductView,
  VenturePlan,
  VentureState,
} from "../../types";
import { GitFacts, SinceFacts, dirtyCount, earliestTouch } from "./gitFacts";

const WALK_ID = "__walk__";

function sinceOf(since: Map<string, SinceFacts>, target: string): SinceFacts {
  // A missing entry reads as touched: staleness may never default to trust.
  return since.get(target) ?? { filesTouched: 1, commitsBehind: 1 };
}

function featureView(
  productId: string,
  feature: FeaturePlan,
  facts: GitFacts,
  evidence: Map<string, EvidenceRecord>,
  since: Map<string, SinceFacts>
): FeatureView {
  const base = {
    id: feature.id,
    name: feature.name,
    dirtyFiles: dirtyCount(facts.dirtyPaths, feature.paths),
    hasCheck: feature.check !== undefined,
  };
  let record = evidence.get(`${productId}/${feature.id}`);
  // Plan drift invalidates evidence: light earned by a command the plan no
  // longer declares is a claim about a different check.
  if (record && (feature.check === undefined || record.command !== feature.check.command)) {
    record = undefined;
  }
  // A recorded run is itself proof that work started, even beyond the log cap.
  const startedAt = earliestTouch(facts.commits, feature.paths)
    ?? (record ? record.timestamp : undefined);
  if (startedAt === undefined) {
    return { ...base, state: "not-started" };
  }
  if (!record) {
    return { ...base, state: "in-progress", startedAt };
  }
  if (record.exitCode !== 0) {
    return {
      ...base, state: "failing", startedAt, evidence: record,
      failingCount: record.consecutiveFailures ?? 1,
    };
  }
  const moved = sinceOf(since, `${productId}/${feature.id}`);
  if (moved.filesTouched > 0) {
    const behind = Math.max(moved.commitsBehind, 1);
    return { ...base, state: "stale", startedAt, evidence: record, behind };
  }
  return { ...base, state: "verified", startedAt, evidence: record };
}

function isoTime(iso: string | undefined): number {
  if (iso === undefined) {
    return Number.MAX_SAFE_INTEGER;
  }
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function productView(
  product: ProductPlan,
  facts: GitFacts,
  evidence: Map<string, EvidenceRecord>,
  since: Map<string, SinceFacts>
): ProductView {
  const features = product.features.map(f => featureView(product.id, f, facts, evidence, since));
  const startedFeatures = features.filter(f => f.state !== "not-started");
  const startedAt = startedFeatures.reduce<string | undefined>(
    (min, f) => (isoTime(f.startedAt) < isoTime(min) ? f.startedAt : min),
    undefined
  );
  const allPaths = product.features.flatMap(f => f.paths);
  let walkEvidence = evidence.get(`${product.id}/${WALK_ID}`);
  if (walkEvidence && (product.walk === undefined || walkEvidence.command !== product.walk.command)) {
    walkEvidence = undefined;
  }
  // A product with no declared features has nothing to earn light with.
  const productVerified =
    features.length > 0 &&
    features.every(f => f.state === "verified") &&
    walkEvidence !== undefined &&
    walkEvidence.exitCode === 0 &&
    sinceOf(since, `${product.id}/${WALK_ID}`).filesTouched === 0;
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    started: startedFeatures.length > 0,
    startedAt,
    features,
    startedCount: startedFeatures.length,
    verifiedCount: features.filter(f => f.state === "verified").length,
    productVerified,
    walkEvidence,
    orbitIndex: 0,
    dirtyFiles: dirtyCount(facts.dirtyPaths, allPaths),
  };
}

function assignOrbits(products: ProductView[]): void {
  const formation = products
    .filter(p => p.started)
    .sort((a, b) => isoTime(a.startedAt) - isoTime(b.startedAt));
  const orbit = new Map<string, number>();
  formation.forEach((p, i) => orbit.set(p.id, i));
  let next = formation.length;
  for (const p of products) {
    if (!orbit.has(p.id)) {
      orbit.set(p.id, next);
      next++;
    }
  }
  for (const p of products) {
    p.orbitIndex = orbit.get(p.id) ?? 0;
  }
}

function rootBasename(planPath: string): string {
  const parts = planPath.split(/[\\/]+/).filter(part => part.length > 0);
  while (parts.length > 0) {
    const last = parts[parts.length - 1];
    if (last === "plan.json" || last === ".tellurion") {
      parts.pop();
      continue;
    }
    break;
  }
  return parts.length > 0 ? parts[parts.length - 1] : "venture";
}

export function computeState(input: {
  plan: VenturePlan | null;
  problems: string[];
  planPath: string;
  facts: GitFacts;
  evidence: Map<string, EvidenceRecord>;
  since: Map<string, SinceFacts>;
  now: string;
}): VentureState {
  const { plan, problems, planPath, facts, evidence, since, now } = input;
  const products = (plan ? plan.products : []).map(p => productView(p, facts, evidence, since));
  assignOrbits(products);
  return {
    name: plan ? plan.name : rootBasename(planPath),
    branch: facts.branch,
    headSha: facts.headSha,
    clean: facts.clean,
    products,
    productsInSky: products.filter(p => p.started).length,
    productsVerified: products.filter(p => p.productVerified).length,
    featuresInSky: products.reduce((n, p) => n + p.startedCount, 0),
    scannedAt: now,
    planPath,
    planProblems: problems,
  };
}
