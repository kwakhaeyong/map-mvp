import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const required = [
  "docs/MAP_CONSTITUTION.md",
  "docs/MAP_DESIGN_SYSTEM.md",
  "docs/VISUAL_QA.md",
  "AGENTS.md",
  "src/styles/design-tokens.css",
  "src/map-decision-v1/components/ui/primitives.tsx",
];
const missing = required.filter((file) => !existsSync(file));
if (missing.length) throw new Error(`Missing harness files: ${missing.join(", ")}`);

const textFiles = execSync("git ls-files", { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const conflictFiles = textFiles.filter((file) => {
  if (/\.(png|jpg|jpeg|gif|webp|ico|lock)$/i.test(file)) return false;
  const text = readFileSync(file, "utf8");
  return /^(<<<<<<<|=======|>>>>>>>) /m.test(text);
});
if (conflictFiles.length) throw new Error(`Conflict markers found: ${conflictFiles.join(", ")}`);

const forbiddenBranding = textFiles.filter((file) => /^(app|src)\//.test(file) && readFileSync(file, "utf8").includes("MMAP Decision"));
if (forbiddenBranding.length) throw new Error(`Forbidden branding found: ${forbiddenBranding.join(", ")}`);

console.log("Harness check passed.");
