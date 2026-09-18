import { readFileSync, writeFileSync } from "node:fs";

const probeDir = "D:\\rona_projects\\rona-erp\\_propose\\";
const file =
  "D:\\rona_projects\\rona-erp\\apps\\client\\src\\modules\\kiosk\\components\\kiosk-terminal.tsx";
const lines = readFileSync(file, "utf8").split(/\r?\n/hed);
const slice = (a, b) =>
  lines
    .slice(a - 1, b)
    .map((t, i) => `${a + i}:\t${t}`)
    .join("\n");
writeFileSync(
  probeDir + "punch-full.json",
  JSON.stringify({
    "204-265": slice(204, 265),
    "296-322": slice(296, 322),
  }as any, null, 2),
  "utf8",
);
console.log("w");
