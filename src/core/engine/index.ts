// Headless engine facade. Nothing under src/core/engine may import vscode;
// the walk drives this module under plain node.
import { ScanEvent, VentureState } from "../../types";
import { loadEvidence } from "./evidence";
import { SinceFacts, changedSince, gatherGitFacts } from "./gitFacts";
import { loadPlan } from "./plan";
import { computeState } from "./state";

const WALK_ID = "__walk__";

// Every emitted line is a milestone that actually happened, with its real
// numbers, in the order the scan reached it. There is no scripted pacing:
// a slow phase streams late because it finished late.
export type ScanListener = (event: ScanEvent) => void;

function emit(listener: ScanListener | undefined, kind: ScanEvent["kind"], line: string): void {
  if (listener) listener({ at: new Date().toISOString(), kind, line });
}

export async function computeVentureState(
  root: string,
  onEvent?: ScanListener
): Promise<VentureState> {
  const { plan, problems, planPath } = loadPlan(root);
  if (plan) {
    const featureCount = plan.products.reduce((n, p) => n + p.features.length, 0);
    emit(onEvent, "scan", `plan loaded: ${plan.products.length} products, ${featureCount} features from ${planPath}`);
  } else {
    emit(onEvent, "scan", `no plan at ${planPath}`);
  }
  for (const problem of problems) {
    emit(onEvent, "error", `plan problem: ${problem}`);
  }
  const facts = await gatherGitFacts(root);
  emit(onEvent, "scan",
    `git history read: ${facts.commits.length} commits on ${facts.branch || "no branch"}, ` +
    `${facts.clean ? "clean" : facts.dirtyPaths.length + " dirty files"}`);
  const evidence = loadEvidence(root);
  emit(onEvent, "scan", `evidence loaded: ${evidence.size} recorded runs`);

  // Ancestry-true movement since each evidence sha, per target, so merge order
  // and evil merges can never hide a path change from staleness.
  const since = new Map<string, SinceFacts>();
  if (plan) {
    const jobs: Promise<void>[] = [];
    for (const product of plan.products) {
      const allPaths = product.features.flatMap(f => f.paths);
      for (const feature of product.features) {
        const target = `${product.id}/${feature.id}`;
        const record = evidence.get(target);
        if (!record) continue;
        jobs.push(changedSince(root, record.sha, feature.paths).then(v => { since.set(target, v); }));
      }
      const walkTarget = `${product.id}/${WALK_ID}`;
      const walkRecord = evidence.get(walkTarget);
      if (walkRecord) {
        jobs.push(changedSince(root, walkRecord.sha, allPaths).then(v => { since.set(walkTarget, v); }));
      }
    }
    await Promise.all(jobs);
    if (jobs.length > 0) {
      emit(onEvent, "scan", `staleness measured: ${jobs.length} evidence records diffed against HEAD`);
    }
  }

  const state = computeState({
    plan, problems, planPath, facts, evidence, since, now: new Date().toISOString(),
  });
  for (const product of state.products) {
    if (!product.started) continue;
    emit(onEvent, "scan",
      product.productVerified
        ? `${product.id}: PRODUCT VERIFIED, ${product.verifiedCount}/${product.features.length} features`
        : `${product.id}: ${product.verifiedCount}/${product.features.length} verified, ${product.startedCount} started`);
  }
  return state;
}

export { runCheck, revoke, loadEvidence } from "./evidence";
export type {
  CheckSpec,
  EvidenceRecord,
  FeaturePlan,
  FeatureState,
  FeatureView,
  ProductPlan,
  ProductView,
  ScanEvent,
  VenturePlan,
  VentureState,
} from "../../types";
