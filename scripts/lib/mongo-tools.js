import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const databaseName = (uri) => {
  const parsed = new URL(uri);
  const name = decodeURIComponent(parsed.pathname.slice(1));
  if (
    !["mongodb:", "mongodb+srv:"].includes(parsed.protocol) ||
    !name ||
    /[\s/\\.$]/.test(name)
  )
    throw new Error(
      "A connection string with an explicit database name is required",
    );
  return name;
};

export const mongoTool = async (tool, uri, args, extraMount = null) => {
  const directory = await mkdtemp(join(tmpdir(), "hasad-mongo-config-"));
  const filename = join(directory, "config.yml");
  await writeFile(filename, JSON.stringify({ uri }), { mode: 0o600 });
  let child;
  const native = process.env.MONGO_TOOLS_MODE === "native";
  if (native)
    child = spawn(tool, ["--config", filename, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
  else {
    const mounts = [
      "--mount",
      `type=bind,source=${directory},target=/run/hasad-config,readonly`,
    ];
    if (extraMount)
      mounts.push(
        "--mount",
        `type=bind,source=${extraMount},target=/run/hasad-archive,readonly`,
      );
    child = spawn(
      "docker",
      [
        "run",
        "--rm",
        "--network",
        "host",
        "--user",
        `${process.getuid()}:${process.getgid()}`,
        "--entrypoint",
        tool,
        ...mounts,
        process.env.MONGO_TOOLS_IMAGE || "mongo:8",
        "--config",
        "/run/hasad-config/config.yml",
        ...args,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
  }
  // Never forward tool stderr: authentication errors can contain connection details.
  child.stderr.resume();
  const completed = new Promise((resolve, reject) => {
    child.once("error", (error) =>
      reject(new Error(`${tool} could not start (${error.code})`)),
    );
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${tool} failed (exit ${code})`)),
    );
  });
  return {
    child,
    completed,
    close: () => rm(directory, { recursive: true, force: true }),
  };
};
