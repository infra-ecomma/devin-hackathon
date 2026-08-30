// DEPRECATED — dead code from the old filesystem-based scanner.
// The engine now uses .tellurion/plan.json instead.
// Stubbed to return correct types; not wired into any caller.
import { Planet, Moon } from "../types";

export class ProjectScanner {
  async scan(_root: string): Promise<Planet[]> {
    return [];
  }

  private moons(_dir: string, _parentName: string): Moon[] {
    return [];
  }
}
