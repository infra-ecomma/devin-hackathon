import * as path from "path";
import * as fs from "fs";
import { Planet, Moon, CensusEntry } from "../types";

const COLORS: Record<string,string> = {
  api:"#4fc3f7", frontend:"#ab47bc", database:"#66bb6a", infra:"#ffa726", ml:"#ef5350", auth:"#ec407a"
};
const MOON_COLORS=["#4fc3f7","#29b6f6","#039be5","#0277bd","#ab47bc","#ba68c8","#9c27b0","#66bb6a","#81c784","#4caf50"];

interface ScanNode { name:string; children:ScanNode[]; isLeaf:boolean; exts:Set<string>; }

export class ProjectScanner {
  private skip = new Set(["node_modules",".git",".next",".nuxt","dist","build","vendor"]);

  async scan(root: string): Promise<Planet[]> {
    return this.buildPlanets(this.tree(root, root, 0), root);
  }

  private tree(dir: string, _root: string, d: number): ScanNode {
    if (d > 4) return { name: path.basename(dir), children: [], isLeaf: true, exts: new Set() };
    try {
      const kids: ScanNode[] = [];
      const exts = new Set<string>();
      for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
        if (this.skip.has(e.name)) continue;
        const fp = path.join(dir, e.name);
        if (e.isDirectory()) kids.push(this.tree(fp, dir, d + 1));
        else if (e.isFile()) {
          const ex = path.extname(e.name).replace(".", "");
          if (ex) exts.add(ex);
        }
      }
      const totalFiles = exts.size + kids.reduce((s, c) => s + c.exts.size, 0);
      return {
        name: path.basename(dir),
        children: kids,
        isLeaf: !kids.length || totalFiles < 2,
        exts
      };
    } catch (_err) {
      return { name: path.basename(dir), children: [], isLeaf: true, exts: new Set() };
    }
  }

  private buildPlanets(node: ScanNode, _root: string): Planet[] {
    if (!node.children.length) return [];
    const cat = this.categorize(node.name);
    const color = COLORS[cat] || "#90a4ae";
    const moons: Moon[] = node.children.slice(0, 5).map((c, i) => ({
      id: Date.now() + "-m-" + i,
      name: c.name,
      color: MOON_COLORS[i % MOON_COLORS.length],
      orbitR: 25 + i * 8,
      speed: 0.01 - i * 0.001,
      angle: i * 1.2,
      size: Math.max(3, 6 - i),
      verified: false
    }));
    return [{
      id: "p-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: node.name,
      description: "Category: " + cat,
      color,
      orbitRadius: 0,
      speed: 0.002 + Math.random() * 0.002,
      angle: Math.random() * Math.PI * 2,
      size: Math.max(10, Math.min(22, moons.length * 3)),
      verified: false,
      moons
    }];
  }

  private categorize(name: string): string {
    const l = name.toLowerCase();
    if (/api|routes|controllers/.test(l)) return "api";
    if (/front|ui|pages?|components?|views?/.test(l)) return "frontend";
    if (/db|data|model|schema/.test(l)) return "database";
    if (/infra|deploy|ci|docker/.test(l)) return "infra";
    if (/ml/i.test(l)) return "ml";
    if (/auth|login|token/.test(l)) return "auth";
    return "default";
  }

  getCensus(root: string): CensusEntry[] {
    const counts = new Map<string, number>();
    const walk = (dir: string, depth: number) => {
      if (depth > 3) return;
      try {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const fp = path.join(dir, e.name);
          if (e.isDirectory()) walk(fp, depth + 1);
          else {
            const ex = path.extname(e.name).replace(".", "") || "none";
            counts.set(ex, (counts.get(ex) || 0) + 1);
          }
        }
      } catch { /* ignore unreadable */ }
    };
    walk(root, 0);
    return [{
      category: "Files",
      count: counts.size,
      details: [...counts.entries()]
        .map(([ext, cnt]) => ({ name: "." + ext, extensions: [ext], count: cnt }))
        .sort((a: any, b: any) => b.count - a.count)
    }];
  }
}
