// Earned Light domain contract. The engine computes semantics only; every visual
// decision (colors, sizes, rings, shades) lives in the webview's skin tokens.
// Law of light: nothing appears until work starts, nothing turns solid without a
// recorded exit 0, and no code path may set a verified state by hand.

export type FeatureState =
  | "not-started"   // absent from the sky; exists only as a plan row
  | "in-progress"   // work started, no green evidence at HEAD
  | "failing"       // latest recorded check exited non-zero
  | "verified"      // recorded exit 0, and no commit touched the feature's paths since
  | "stale";        // recorded exit 0, but commits touched the paths after it

export interface CheckSpec {
  command: string;        // executed with shell in the workspace root
  timeoutMs?: number;     // default 120000
}

export interface FeaturePlan {
  id: string;             // stable slug, unique within the product
  name: string;           // noun phrase: what the product can now DO
  paths: string[];        // repo-relative path prefixes owned by this feature
  check?: CheckSpec;      // the only thing that can flip this moon solid
}

export interface ProductPlan {
  id: string;
  name: string;
  category: "api" | "frontend" | "database" | "infra" | "ml" | "auth" | "default";
  features: FeaturePlan[];
  walk?: CheckSpec;       // product-level end-to-end check; required for PRODUCT VERIFIED
}

export interface VenturePlan {
  name: string;
  products: ProductPlan[];
}

export interface EvidenceRecord {
  target: string;         // "<productId>/<featureId>" or "<productId>/__walk__"
  command: string;
  exitCode: number;
  sha: string;            // HEAD at the moment the check ran
  timestamp: string;      // ISO
  durationMs: number;
  logTail: string[];      // last lines of combined output, capped
  consecutiveFailures?: number; // present on failing records: unbroken run of non-zero exits
}

export interface FeatureView {
  id: string;
  name: string;
  state: FeatureState;
  startedAt?: string;     // ISO of the earliest commit touching paths
  evidence?: EvidenceRecord;
  behind?: number;        // commits touching paths after evidence.sha (stale only)
  failingCount?: number;  // consecutive failing runs
  dirtyFiles?: number;    // uncommitted files under paths, right now
  hasCheck: boolean;
}

export interface ProductView {
  id: string;
  name: string;
  category: ProductPlan["category"];
  started: boolean;             // any feature started: only then is a planet drawn
  startedAt?: string;
  features: FeatureView[];
  startedCount: number;
  verifiedCount: number;        // verified at HEAD (stale does not count)
  productVerified: boolean;     // ALL declared features verified AND walk exit 0 at HEAD
  walkEvidence?: EvidenceRecord;
  orbitIndex: number;           // formation order among started products, stable
  dirtyFiles: number;
}

export interface VentureState {
  name: string;
  branch: string;
  headSha: string;
  clean: boolean;
  products: ProductView[];      // every declared product, drawn or not (started flags)
  productsInSky: number;
  productsVerified: number;
  featuresInSky: number;
  scannedAt: string;
  planPath: string;
  planProblems: string[];       // honest surface for a malformed plan; never invented data
}

export interface ScanEvent {
  at: string;                   // ISO
  kind: "scan" | "check" | "verify" | "revoke" | "commit" | "error";
  line: string;                 // rendered verbatim in the mission log
}

// ---- Webview protocol ----------------------------------------------------

export type SkinStyle = "futuristic" | "rustic";
export type SkinTheme = "dark" | "light" | "auto";

export type ToWebview =
  | { type: "state"; state: VentureState; style: SkinStyle; theme: "dark" | "light"; themeSetting: SkinTheme }
  | { type: "event"; event: ScanEvent }
  | { type: "skin"; style: SkinStyle; theme: "dark" | "light"; themeSetting: SkinTheme }
  | { type: "checking"; target: string };   // measuring state while a check runs

export type FromWebview =
  | { type: "ready" }
  | { type: "refresh" }
  | { type: "runCheck"; productId: string; featureId: string }
  | { type: "runWalk"; productId: string }
  | { type: "revoke"; productId: string; featureId: string }
  | { type: "setSkin"; style: SkinStyle; theme: SkinTheme }
  | { type: "openPath"; path: string };

export const DEFAULT_STYLE: SkinStyle = "rustic";
export const DEFAULT_THEME: SkinTheme = "light";
