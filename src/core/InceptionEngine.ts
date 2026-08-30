import * as fs from "fs";
import * as path from "path";
import { SpineStep } from "../types";

export class InceptionEngine {
  async run(root: string): Promise<SpineStep[]> {
    const r: any = { hasBackend:false, hasFrontend:false, hasDatabase:false, hasTests:false, hasCI:false };
    try {
      for (const e of fs.readdirSync(root)) {
        const fp = path.join(root, e);
        if (e === "package.json") {
          try {
            const p = JSON.parse(fs.readFileSync(fp, "utf-8"));
            const d = { ...(p.dependencies || {}), ...(p.devDependencies || {}) };
            if (d.next || d.nuxt) r.hasFrontend = true;
            if (d.react) r.hasFrontend = true;
            if (d.express) r.hasBackend = true;
            if (d.prisma || d.sequelize) r.hasDatabase = true;
            if (d.jest || d.mocha) r.hasTests = true;
          } catch {}
        }
        if (e === "Dockerfile" || e.endsWith(".dockerfile")) r.hasCI = true;
        if (e === ".github" && fs.statSync(fp).isDirectory()) r.hasCI = true;
      }
    } catch {}
    return this.buildSpine(r);
  }

  private buildSpine(d: any): SpineStep[] {
    const steps: SpineStep[] = [
      { id: "s1", label: "Project Setup & Scaffold", status: "completed", progress: 100 },
      { id: "s2", label: "Repository Discovery", status: "completed", progress: 100 }
    ];
    if (d.hasFrontend) {
      steps.push({ id: "s3", label: "Frontend Architecture", status: "active", progress: 45 });
      steps.push({ id: "s4", label: "Page Routes & Layouts", status: "pending", progress: 0 });
    } else {
      steps.push({ id: "s3", label: "Deliverable Mapping", status: "active", progress: 30 });
    }
    if (d.hasBackend) steps.push({ id: "s-api", label: "API Layer & Routes", status: "pending", progress: 0 });
    if (d.hasDatabase) steps.push({ id: "s-db", label: "Database Models & Migrations", status: "pending", progress: 0 });
    if (d.hasTests) {
      steps.push({ id: "s-test", label: "Test Suite Implementation", status: "pending", progress: 0 });
    } else {
      steps.push({ id: "s-test", label: "Test Framework Setup", status: "pending", progress: 0 });
    }
    if (d.hasCI) {
      steps.push({ id: "s-deploy", label: "Deployment Pipeline", status: "pending", progress: 0 });
    } else {
      steps.push({ id: "s-deploy", label: "Build & Deploy Strategy", status: "pending", progress: 0 });
    }
    steps.push({ id: "s-verify", label: "Integration Verification", status: "pending", progress: 0 });
    steps.push({ id: "s-launch", label: "Production Launch", status: "pending", progress: 0 });
    return steps;
  }
}
