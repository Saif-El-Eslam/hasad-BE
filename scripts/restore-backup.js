import { createDecipheriv } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { open, mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { pipeline } from "node:stream/promises";
import "../src/config/index.js";
import { mongoTool, databaseName } from "./lib/mongo-tools.js";

let directory, tool;
try {
  const filename = process.argv.find(
    (value, index) => index > 1 && value !== "--restore",
  );
  if (!filename)
    throw new Error(
      "Pass an encrypted backup file; add --restore only for an isolated restore drill",
    );
  const key = process.env.BACKUP_ENCRYPTION_KEY;
  if (!/^[a-fA-F0-9]{64}$/.test(key || ""))
    throw new Error("BACKUP_ENCRYPTION_KEY must be a 64-character hex key");
  const source = resolve(filename);
  const file = await open(source, "r");
  let header, metadata, size, tag;
  try {
    size = (await file.stat()).size;
    const prefix = Buffer.alloc(1024);
    const { bytesRead } = await file.read(prefix, 0, prefix.length, 0);
    const end = prefix.subarray(0, bytesRead).indexOf(10);
    if (end < 0 || size <= end + 17) throw new Error("Invalid backup header");
    header = prefix.subarray(0, end + 1);
    metadata = JSON.parse(header.toString());
    if (
      metadata.format !== "hasad-backup-v1" ||
      !/^[a-f0-9]{24}$/.test(metadata.iv)
    )
      throw new Error("Unsupported backup format");
    tag = Buffer.alloc(16);
    await file.read(tag, 0, 16, size - 16);
  } finally {
    await file.close();
  }
  directory = await mkdtemp(join(tmpdir(), "hasad-restore-"));
  const archive = join(directory, "backup.archive.gz");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(metadata.iv, "hex"),
  );
  decipher.setAAD(header);
  decipher.setAuthTag(tag);
  // Authenticate the entire archive before allowing mongorestore to write anything.
  await pipeline(
    createReadStream(source, { start: header.length, end: size - 17 }),
    decipher,
    createWriteStream(archive, { flags: "wx", mode: 0o600 }),
  );
  if (process.argv.includes("--restore")) {
    const uri = process.env.RESTORE_DB_URL;
    const target = databaseName(uri);
    if (
      target === metadata.database ||
      process.env.RESTORE_CONFIRM_DATABASE_NAME !== target
    )
      throw new Error(
        "Restore drills require a different database name and RESTORE_CONFIRM_DATABASE_NAME matching the target",
      );
    const mountPath =
      process.env.MONGO_TOOLS_MODE === "native"
        ? archive
        : "/run/hasad-archive/backup.archive.gz";
    const restoreUri = new URL(uri);
    if (restoreUri.username && !restoreUri.searchParams.has("authSource"))
      restoreUri.searchParams.set("authSource", target);
    // A database in the URI filters source namespaces before --nsFrom remapping.
    restoreUri.pathname = "/";
    tool = await mongoTool(
      "mongorestore",
      restoreUri.toString(),
      [
        `--archive=${mountPath}`,
        "--gzip",
        "--stopOnError",
        `--nsInclude=${metadata.database}.*`,
        `--nsFrom=${metadata.database}.*`,
        `--nsTo=${target}.*`,
      ],
      directory,
    );
    tool.child.stdout.resume();
    await tool.completed;
    console.log(JSON.stringify({ status: "restored", target }));
  } else
    console.log(
      JSON.stringify({
        status: "verified",
        createdAt: metadata.createdAt,
        database: metadata.database,
      }),
    );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await tool?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
}
