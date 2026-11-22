import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import process from "node:process";

const root = resolve(".output/public");
const token = process.env.NOTIFY_DEV_STAFF_TOKEN?.trim();
let files = 0;
let leaked = false;
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else {
      files++;
      if (token && (await readFile(path)).includes(Buffer.from(token))) {
        console.error(`FAIL: development credential found in ${path}`);
        leaked = true;
      }
    }
  }
}
try {
  await readFile(join(root, "index.html"));
  await readFile(join(root, "200.html"));
  await inspect(root);
  if (!leaked)
    console.log(
      `PASS: static entry points exist; inspected ${files} files${token ? ", development token absent" : " (no local token configured to compare)"}.`,
    );
  process.exitCode = leaked ? 1 : 0;
} catch {
  console.error("Static output is missing. Run npm run generate first.");
  process.exitCode = 1;
}
