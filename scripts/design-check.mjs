import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync("git ls-files 'app/**/*.{ts,tsx,css}' 'src/**/*.{ts,tsx,css}'", { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const tokenFiles = new Set(["src/styles/design-tokens.css", "app/globals.css", "tailwind.config.ts"]);
const rawColor = /(?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/;
const offenders = [];
for (const file of files) {
  if (tokenFiles.has(file)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (rawColor.test(line)) offenders.push(`${file}:${index + 1}`);
  });
}
if (offenders.length) throw new Error(`Raw color values outside token/global files:\n${offenders.join("\n")}`);
console.log("Design check passed.");
