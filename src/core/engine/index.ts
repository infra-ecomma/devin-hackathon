// Headless engine facade. Nothing under src/core/engine may import vscode;
// the walk drives this module under plain node.
import { VentureState } from "../../types";
import { loadEvidence } from "./evidence";
import { SinceFacts, changedSince, gatherGitFacts } from "./gitFacts";
import { loadPlan } from "./plan";
import { computeState } from "./state";

const WALK_ID = "__walk__";

export async function computeVentureState(root: string): Promise<VentureState> {
  const { plan, problems, planPath } = loadPlan(root);
  const facts = await gatherGitFacts(root);
  const evidence = loadEvidence(root);

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
  }

  return computeState({
    plan, problems, planPath, facts, evidence, since, now: new Date().toISOString(),
  });
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
