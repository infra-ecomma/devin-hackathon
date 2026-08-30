// Read-only git observations for the Earned Light engine. A root with no
// commits, or no git repository at all, yields honestly empty facts and never
// throws. Runs headless under plain node; no vscode imports allowed here.
import { execFile } from "child_process";

export interface CommitFact {
  sha: string;
  iso: string;
  files: string[];
}

export interface GitFacts {
  headSha: string;
  branch: string;
  clean: boolean;
  dirtyPaths: string[];
  commits: CommitFact[];
}

const LOG_COMMIT_CAP = 5000;
// A capped log with per-commit file lists can far exceed execFile's 1MB default.
const GIT_MAX_BUFFER = 64 * 1024 * 1024;
const COMMIT_HEADER = /^([0-9a-f]{40})\t(\S+)$/;

function git(root: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd: root, maxBuffer: GIT_MAX_BUFFER }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

async function gitOr(root: string, args: string[], fallback: string): Promise<string> {
  try {
    return await git(root, args);
  } catch {
    return fallback;
  }
}

// git C-quotes paths carrying unusual characters. Stripping the surrounding
// quotes keeps ordinary paths matchable; inner escapes arrive as-is.
function stripQuotes(p: string): string {
  return p.length >= 2 && p.startsWith("\"") && p.endsWith("\"") ? p.slice(1, -1) : p;
}

export async function gatherGitFacts(root: string): Promise<GitFacts> {
  const headSha = (await gitOr(root, ["rev-parse", "HEAD"], "")).trim();

  let branch = "";
  try {
    branch = (await git(root, ["rev-parse", "--abbrev-ref", "HEAD"])).trim();
  } catch {
    // Unborn branch: HEAD resolves to nothing, but the symbolic ref still names it.
    branch = (await gitOr(root, ["symbolic-ref", "--short", "HEAD"], "")).trim();
  }

  const statusOut = await gitOr(root, ["-c", "core.quotepath=false", "status", "--porcelain", "-uall"], "");
  const dirtyPaths: string[] = [];
  for (const line of statusOut.split("\n")) {
    if (line.trim() === "") continue;
    const entry = line.slice(3);
    const arrow = entry.lastIndexOf(" -> ");
    const last = arrow >= 0 ? entry.slice(arrow + 4) : entry;
    const cleaned = stripQuotes(last);
    if (cleaned !== "") dirtyPaths.push(cleaned);
  }

  const commits: CommitFact[] = [];
  const logOut = headSha === ""
    ? ""
    : await gitOr(root, [
        "-c", "core.quotepath=false",
        "log", "--name-only", "--format=%H%x09%cI", "-n", String(LOG_COMMIT_CAP)
      ], "");
  let current: CommitFact | null = null;
  for (const line of logOut.split("\n")) {
    if (line === "") continue;
    const header = COMMIT_HEADER.exec(line);
    if (header) {
      current = { sha: header[1], iso: header[2], files: [] };
      commits.push(current);
    } else if (current !== null) {
      current.files.push(stripQuotes(line));
    }
  }

  return { headSha, branch, clean: dirtyPaths.length === 0, dirtyPaths, commits };
}

export function pathsMatch(file: string, prefixes: string[]): boolean {
  for (const raw of prefixes) {
    if (raw === ".") return true;
    let prefix = raw;
    while (prefix.endsWith("/")) prefix = prefix.slice(0, -1);
    if (prefix === "") continue;
    if (file === prefix || file.startsWith(prefix + "/")) return true;
  }
  return false;
}

export function earliestTouch(commits: CommitFact[], prefixes: string[]): string | undefined {
  for (let i = commits.length - 1; i >= 0; i--) {
    const commit = commits[i];
    if (commit.files.some(f => pathsMatch(f, prefixes))) return commit.iso;
  }
  return undefined;
}

export function touchesSince(commits: CommitFact[], prefixes: string[], sinceSha: string): number {
  let count = 0;
  for (const commit of commits) {
    if (commit.sha === sinceSha) return count;
    if (commit.files.some(f => pathsMatch(f, prefixes))) count += 1;
  }
  return count;
}

export interface SinceFacts {
  filesTouched: number;   // files under the prefixes that differ between sha and HEAD
  commitsBehind: number;  // ancestry commits after sha touching the prefixes
}

// Ancestry-true staleness. git log order is date order, so parallel-branch
// commits with older dates hide from a positional scan; the tree diff between
// the evidence sha and HEAD cannot be hidden by merge order or evil merges.
// An unknown sha (rewritten history) reads as touched: the honest direction.
export async function changedSince(
  root: string,
  sinceSha: string,
  prefixes: string[]
): Promise<SinceFacts> {
  const scoped = prefixes.filter(p => typeof p === "string" && p !== "");
  if (sinceSha === "" || scoped.length === 0) {
    return { filesTouched: 0, commitsBehind: 0 };
  }
  const pathArgs = ["--", ...scoped.map(p => (p === "." ? "." : p))];
  try {
    const diffOut = await git(root, [
      "-c", "core.quotepath=false",
      "diff", "--name-only", sinceSha, "HEAD", ...pathArgs,
    ]);
    const filesTouched = diffOut.split("\n").filter(l => l.trim() !== "").length;
    let commitsBehind = 0;
    try {
      const revOut = await git(root, ["rev-list", "--count", `${sinceSha}..HEAD`, ...pathArgs]);
      commitsBehind = parseInt(revOut.trim(), 10) || 0;
    } catch {
      commitsBehind = 0;
    }
    return { filesTouched, commitsBehind };
  } catch {
    return { filesTouched: 1, commitsBehind: 1 };
  }
}

export function dirtyCount(dirtyPaths: string[], prefixes: string[]): number {
  let count = 0;
  for (const p of dirtyPaths) {
    if (pathsMatch(p, prefixes)) count += 1;
  }
  return count;
}
