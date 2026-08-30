import * as fs from "fs";
import * as path from "path";
import { BrandConfig } from "../types";

export class BrandingAdapter {
  private defaults: BrandConfig = {
    name: "Tellurion",
    colors: { primary: "#4fc3f7", secondary: "#ab47bc", accent: "#66bb6a" },
    fonts: "Inter, system-ui, sans-serif"
  };

  scan(root: string): BrandConfig {
    const c: Partial<BrandConfig> = {};
    // Project name
    try {
      const p = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
      c.name = p.name || p.displayName || path.basename(root);
    } catch (_e) { /* ignore */ }
    if (!c.name) c.name = path.basename(root);

    // Colors from tailwind.config
    for (const name of ["tailwind.config.js", "tailwind.config.ts"]) {
      const fp = path.join(root, name);
      if (!fs.existsSync(fp)) continue;
      try {
        const t = fs.readFileSync(fp, "utf-8");
        const pm = t.match(/primary\s*:\s*["'](#?[0-9a-fA-F]{3,8})/);
        if (pm && !pm[1].startsWith("#")) {
          c.colors = { ...(c.colors||this.defaults.colors), primary: "#" + pm[1] };
        } else if (pm) {
          c.colors = { ...(c.colors||this.defaults.colors), primary: pm[1] };
        }
        const am = t.match(/accent\s*:\s*["'](#?[0-9a-fA-F]{3,8})/);
        if (am && !am[1].startsWith("#")) {
          c.colors = { ...(c.colors||this.defaults.colors), accent: "#" + am[1] };
        } else if (am) {
          c.colors = { ...(c.colors||this.defaults.colors), accent: am[1] };
        }
      } catch {}
    }

    // CSS variables --primary, --brand, etc.
    const cssFiles = this.findCssFiles(root);
    for (const cf of cssFiles) {
      try {
        const content = fs.readFileSync(cf, "utf-8");
        const pm = content.match(/--primary\s*:\s*(#[0-9a-fA-F]{3,8})/);
        if (pm) c.colors = { ...(c.colors||this.defaults.colors), primary: pm[1] };
        const sm = content.match(/--secondary\s*:\s*(#[0-9a-fA-F]{3,8})/);
        if (sm) c.colors = { ...(c.colors||this.defaults.colors), secondary: sm[1] };
        const ac = content.match(/--accent\s*:\s*(#[0-9a-fA-F]{3,8})/);
        if (ac) c.colors = { ...(c.colors||this.defaults.colors), accent: ac[1] };
      } catch {}
    }

    // Fonts from tailwind fontFamily config
    for (const name of ["tailwind.config.js", "tailwind.config.ts"]) {
      const fp = path.join(root, name);
      if (!fs.existsSync(fp)) continue;
      try {
        const content = fs.readFileSync(fp, "utf-8");
        const fm = content.match(/fontFamily\s*:\s*\{([\s\S]*?)\}/);
        if (fm) {
          const lines = fm[1].split(",").map(l => l.trim().replace(/["']/g, "").split(",").join(", "));
          c.fonts = lines[0] || this.defaults.fonts;
        }
      } catch {}
    }

    // Logo detection
    for (const dir of ["public", "src/assets", "assets", "images"]) {
      for (const fname of ["logo.png", "logo.svg", "icon.png", "icon.svg", "brand.png", "favicon.ico"]) {
        const fp = path.join(root, dir, fname);
        if (fs.existsSync(fp)) {
          c.logoUrl = "/" + dir + "/" + fname;
          break;
        }
      }
      if (c.logoUrl) break;
    }

    return { ...this.defaults, ...c, colors: { ...this.defaults.colors, ...(c.colors || {}) } };
  }

  private findCssFiles(root: string, depth: number = 0): string[] {
    if (depth > 3) return [];
    const files: string[] = [];
    try {
      for (const e of fs.readdirSync(root, { withFileTypes: true })) {
        const fp = path.join(root, e.name);
        if (e.isFile() && e.name.endsWith(".css")) files.push(fp);
        else if (e.isDirectory()) files.push(...this.findCssFiles(fp, depth + 1));
      }
    } catch {}
    return files;
  }
}
