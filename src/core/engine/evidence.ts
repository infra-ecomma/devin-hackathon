// Evidence is the only source of light. A record is written solely by actually
// executing the declared check; nothing else in the codebase may mint one.
import { spawn, execFile } from "child_process";
import { promises as fsp, readdirSync, readFileSync } from "fs";
import * as path from "path";
import { CheckSpec, EvidenceRecord, VenturePlan } from "../../types";
import { loadPlan } from "./plan";

const WALK_ID = "__walk__";
const DEFAULT_TIMEOUT_MS = 120000;
const TIMEOUT_EXIT_CODE = 124;
const LOG_TAIL_LINES = 40;

function evidenceDir(root: string): string {
  return path.join(root, ".tellurion", "evidence");
}

// base64url of the target: collision-free for any id characters and immune to
// path traversal through ids, since the encoded name never contains a separator.
function evidenceFile(root: string, productId: string, featureId: string): string {
  const name = Buffer.from(`${productId}/${featureId}`, "utf8").toString("base64url");
  return path.join(evidenceDir(root), `${name}.json`);
}

function resolveSpec(
  plan: VenturePlan | null,
  planPath: string,
  productId: string,
  featureId: string
): CheckSpec {
  if (!plan) {
    throw new Error(`No plan could be loaded from ${planPath}.`);
  }
  const product = plan.products.find(p => p.id === productId);
  if (!product) {
    throw new Error(`Product "${productId}" is not in the plan.`);
  }
  if (featureId === WALK_ID) {
    if (!product.walk) {
      throw new Error(`Product "${productId}" declares no walk check in the plan.`);
    }
    return product.walk;
  }
  const feature = product.features.find(f => f.id === featureId);
  if (!feature) {
    throw new Error(`Feature "${featureId}" is not in product "${productId}".`);
  }
  if (!feature.check) {
    throw new Error(`Feature "${productId}/${featureId}" declares no check in the plan.`);
  }
  return feature.check;
}

function tail(combined: string): string[] {
  const lines = combined.split(/\r?\n/);
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.slice(-LOG_TAIL_LINES);
}

interface RunResult {
  exitCode: number;
  logTail: string[];
  durationMs: number;
}

function execute(spec: CheckSpec, root: string): Promise<RunResult> {
  const timeoutMs = spec.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedMs = Date.now();
  return new Promise(resolve => {
    const child = spawn(spec.command, { shell: true, cwd: root });
    const chunks: string[] = [];
    let settled = false;
    const finish = (exitCode: number) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode, logTail: tail(chunks.join("")), durationMs: Date.now() - startedMs });
    };
    // Settle at the deadline rather than waiting on close, so a child that
    // ignores the kill or holds its pipes open cannot stall the record.
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(TIMEOUT_EXIT_CODE);
    }, timeoutMs);
    child.stdout.on("data", d => chunks.push(String(d)));
    child.stderr.on("data", d => chunks.push(String(d)));
    child.on("error", err => {
      chunks.push(`${err.message}\n`);
      finish(127);
    });
    child.on("close", code => {
      finish(code ?? 1);
    });
  });
}

function gitHead(root: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", ["rev-parse", "HEAD"], { cwd: root }, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function runCheck(
  root: string,
  productId: string,
  featureId: string
): Promise<EvidenceRecord> {
  const { plan, planPath } = loadPlan(root);
  const spec = resolveSpec(plan, planPath, productId, featureId);
  // HEAD is pinned BEFORE the run: a commit landing mid-run must decay the
  // record to stale rather than get exit 0 pinned to a sha the run never saw.
  const sha = await gitHead(root);
  const file = evidenceFile(root, productId, featureId);
  let previous: EvidenceRecord | undefined;
  try {
    previous = JSON.parse(await fsp.readFile(file, "utf8")) as EvidenceRecord;
  } catch {
    previous = undefined;
  }
  const result = await execute(spec, root);
  const record: EvidenceRecord = {
    target: `${productId}/${featureId}`,
    command: spec.command,
    exitCode: result.exitCode,
    sha,
    timestamp: new Date().toISOString(),
    durationMs: result.durationMs,
    logTail: result.logTail,
  };
  if (result.exitCode !== 0) {
    const prior = previous && previous.exitCode !== 0 ? previous.consecutiveFailures ?? 1 : 0;
    record.consecutiveFailures = prior + 1;
  }
  await fsp.mkdir(evidenceDir(root), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(record, null, 2));
  await fsp.rename(tmp, file);
  return record;
}

export async function revoke(root: string, productId: string, featureId: string): Promise<void> {
  try {
    await fsp.unlink(evidenceFile(root, productId, featureId));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}

export function loadEvidence(root: string): Map<string, EvidenceRecord> {
  const records = new Map<string, EvidenceRecord>();
  let names: string[];
  try {
    names = readdirSync(evidenceDir(root));
  } catch {
    return records;
  }
  for (const name of names) {
    if (!name.endsWith(".json")) {
      continue;
    }
    try {
      const raw = readFileSync(path.join(evidenceDir(root), name), "utf8");
      const parsed = JSON.parse(raw) as Partial<EvidenceRecord> | null;
      if (
        !parsed ||
        typeof parsed.target !== "string" ||
        !parsed.target.includes("/") ||
        typeof parsed.exitCode !== "number" ||
        typeof parsed.sha !== "string"
      ) {
        continue;
      }
      records.set(parsed.target, parsed as EvidenceRecord);
    } catch {
      continue;
    }
  }
  return records;
}
