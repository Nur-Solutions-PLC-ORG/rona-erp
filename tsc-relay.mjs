import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const OUT = "D:\\rona_projects\\rona-erp\\_tsc-final.json";
const cwd = "D:\\rona_projects\\rona-erp\\apps\\client";
const child = spawn("pnpm", ["exec", "tsc", "--noEmit", "-p", "tsconfig.json"], {
  cwd,
  shell: true,
  env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
});
let stdout = "";
let stderr = "";
child.stdout.on("data", (c) => (stdout += c));
child.stderr.on("data", (c) => (stderr += c));
child.on("error", (e) => {
  writeFileSync(OUT, JSON.stringify({ kind: "spawn-error", message: String(e) }), "utf8");
  console.log("tsc-relay-spawn-error");
});
child.on("close", (code) => {
  const lastLines = (stdout + stderr).split(/\r?\n/).slice(-40).join("\n");
  writeFileSync(OUT, JSON.stringify({ exitCode: code, tail: lastLines }), "utf8");
  console.log("tsc-relay-close");
});
