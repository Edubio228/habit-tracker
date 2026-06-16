function loadBuiltinModule(name) {
  if (typeof process.getBuiltinModule === "function") {
    return process.getBuiltinModule(name);
  }

  return module.constructor._load(name);
}

const { existsSync, readFileSync } = loadBuiltinModule("node:fs");
const { join } = loadBuiltinModule("node:path");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const env = readFileSync(filePath, "utf8");

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [rawKey, ...rawValueParts] = trimmed.split("=");
    const key = rawKey.trim();
    let value = rawValueParts.join("=").trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(join(process.cwd(), ".env"));
loadEnvFile(join(process.cwd(), ".env.local"));

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
