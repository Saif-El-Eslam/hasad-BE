import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const check = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await check(path);
    else if (entry.name.endsWith(".js")) {
      const result = spawnSync(process.execPath, ["--check", path], {
        stdio: "inherit",
      });
      if (result.error) throw result.error;
      if (result.status !== 0) process.exitCode = 1;
    }
  }
};
await check("src");
await check("scripts");
