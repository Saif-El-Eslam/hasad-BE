import { createCipheriv, randomBytes, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pipeline, finished } from "node:stream/promises";
import { config } from "../src/config/index.js";
import { mongoTool, databaseName } from "./lib/mongo-tools.js";

let output, tool, partial;
try {
  const uri = process.env.BACKUP_DB_URL || config.dbUrl;
  const database = databaseName(uri);
  const key = process.env.BACKUP_ENCRYPTION_KEY;
  if (!/^[a-fA-F0-9]{64}$/.test(key || ""))
    throw new Error(
      "BACKUP_ENCRYPTION_KEY must be a 64-character hex key stored separately from backups",
    );
  if (!process.env.BACKUP_DIR)
    throw new Error("Set BACKUP_DIR to persistent private backup storage");
  const directory = resolve(process.env.BACKUP_DIR);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const name = `hasad-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.archive.enc`;
  const final = join(directory, name);
  partial = final + ".partial";
  const iv = randomBytes(12);
  const header = Buffer.from(
    JSON.stringify({
      format: "hasad-backup-v1",
      database,
      createdAt: new Date().toISOString(),
      iv: iv.toString("hex"),
    }) + "\n",
  );
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  cipher.setAAD(header);
  output = createWriteStream(partial, { flags: "wx", mode: 0o600 });
  output.write(header);
  tool = await mongoTool("mongodump", uri, [
    "--db",
    database,
    "--archive",
    "--gzip",
    "--numParallelCollections=1",
    "--readPreference=secondaryPreferred",
  ]);
  await Promise.all([
    pipeline(tool.child.stdout, cipher, output, { end: false }),
    tool.completed,
  ]);
  output.end(cipher.getAuthTag());
  await finished(output);
  await rename(partial, final);
  partial = null;
  console.log(JSON.stringify({ status: "ok", file: final, encrypted: true }));
} catch (error) {
  tool?.child.kill("SIGTERM");
  output?.destroy();
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (partial) await unlink(partial).catch(() => {});
  await tool?.close();
}
