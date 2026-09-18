import { readFileSync, writeFileSync } from "node:fs";

const FILE =
  "D:\\rona_projects\\rona-erp\\apps\\client\\src\\modules\\kiosk\\components\\kiosk-terminal.tsx";
const lines = readFileSync(FILE, "utf8").split(/\r?\n/);
const slice = lines.slice(15, 22);
writeFileSync(
  "D:\\rona_projects\\rona-erp\\_probe\\imports-block.json",
  JSON.stringify(slice, null, 2),
  "utf8",
);
console.log("imports-block-wrote");
