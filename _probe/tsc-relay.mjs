import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const OUT = "D:\\rona_projects\\rona-erp\\_probe\\tsc-final.json";
const client = "D:\\rona_projects\\rona-erp\\apps\\client";
const child = spawn("pnpm", ["exec", "tsc", "--noEmit", "-p", "tsconfig.json"], {
  cwd: client,
  shell: true,
});
let stdout = "";
let stderr = "";
child.stdout.on("data", (c) => (stdout += c));
child.stderr.on("data", (c) => (stderr += c));
child.on("error", (e) => {
  writeFileSync(OUT, JSON.stringify({ kind: "spawn-error", error: String(e) }), "utf8");
  console.log("tsc-relay-done");
});
child.on("close", (code) => {
  const body = { exitCode: code, stderr: stderr.slice(-16000), stdout: stdout.slice(-4000) };
  writeFileSync(OUT, JSON.stringify(body, null, 2), "utf8");
  console.log("tsc-relay-done");
});
