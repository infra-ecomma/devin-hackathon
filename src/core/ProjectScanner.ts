import * as path from "path";
import * as fs from "fs";
import { Planet, Moon } from "../types";

const COLORS: Record<string,string> = {
  api:"#4fc3f7", frontend:"#ab47bc", database:"#66bb6a", infra:"#ffa726", ml:"#ef5350", auth:"#ec407a"
};
const MOON_COLORS=["#4fc3f7","#29b6f6","#039be5","#0277bd","#ab47bc","#ba68c8","#9c27b0","#66bb6a","#81c784","#4caf50"];

function slug(name:string){return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

export class ProjectScanner {
  private skip = new Set(["node_modules",".git",".next",".nuxt","dist","build","out","vendor","coverage",".turbo","__pycache__",".venv",".claude",".gsd",".kit",".rag"]);

  async scan(root: string): Promise<Planet[]> {
    const planets: Planet[] = [];
    try {
      let i = 0;
      for (const e of fs.readdirSync(root, {withFileTypes: true})) {
        if (!e.isDirectory() || e.name.startsWith('.') || this.skip.has(e.name)) continue;
        const dir = path.join(root, e.name);
        const moons = this.moons(dir, e.name);
        const cat = this.categorize(e.name);
        planets.push({
          id: `p-${slug(e.name)}`,
          name: e.name,
          description: `${e.name} deliverable`,
          color: COLORS[cat] || "#90a4ae",
          orbitRadius: 90 + i * 70,
          speed: 0.002 + i * 0.0005,
          angle: Math.random() * Math.PI * 2,
          size: Math.max(10, Math.min(22, 12 + moons.length * 2)),
          verified: false,
          moons
        });
        i++;
      }
    } catch (_err) {}
    return planets;
  }

  private moons(dir: string, parentName: string): Moon[] {
    const moons: Moon[] = [];
    try {
      let i = 0;
      for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
        if (e.name.startsWith('.') || this.skip.has(e.name)) continue;
        const isDir = e.isDirectory();
        const ext = path.extname(e.name).replace('.', '');
        // Skip generic files at root of deliverable; keep sub-dirs and key files
        if (!isDir && (!ext || ['md','txt','json','lock'].includes(ext))) continue;
        moons.push({
          id: `m-${slug(parentName)}-${slug(e.name)}`,
          name: e.name,
          color: MOON_COLORS[i % MOON_COLORS.length],
          orbitR: 28 + i * 10,
          speed: 0.005 + i * 0.001,
          angle: i * 1.2,
          size: Math.max(3, 5 - Math.min(2, i)),
          verified: false
        });
        i++;
        if (i >= 6) break;
      }
    } catch (_err) {}
    return moons;
  }

  private categorize(name: string): string {
    const l = name.toLowerCase();
    if (/api|routes|controllers|server/.test(l)) return "api";
    if (/front|ui|pages?|components?|views?|app/.test(l)) return "frontend";
    if (/db|data|model|schema|prisma/.test(l)) return "database";
    if (/infra|deploy|ci|docker|scripts/.test(l)) return "infra";
    if (/ml/i.test(l)) return "ml";
    if (/auth|login|token/.test(l)) return "auth";
    return "default";
  }
}
