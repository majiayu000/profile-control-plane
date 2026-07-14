import { readFile } from "node:fs/promises";
import {
  Ajv,
  type AnySchema,
  type ErrorObject,
  type ValidateFunction,
} from "ajv";
import type { ProfileConfig } from "../core/types.js";
import { ProfileError } from "../core/errors.js";

const schemaUrl = new URL("../../schemas/profile.schema.json", import.meta.url);
let validatorPromise: Promise<ValidateFunction> | undefined;

function formatValidationError(error: ErrorObject): string {
  const path = error.instancePath || "/";
  return `${path} ${error.message ?? "is invalid"}`;
}

async function getValidator(): Promise<ValidateFunction> {
  validatorPromise ??= readFile(schemaUrl, "utf8").then((source) => {
    const schema = JSON.parse(source) as AnySchema;
    return new Ajv({ allErrors: true, strict: true }).compile(schema);
  });
  return validatorPromise;
}

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

export async function assertProfileConfig(
  value: unknown,
): Promise<ProfileConfig> {
  const validate = await getValidator();
  if (!validate(value)) {
    throw new ProfileError(
      "CONFIG_INVALID",
      "profile configuration failed schema validation",
      (validate.errors ?? []).map(formatValidationError),
    );
  }

  const config = value as ProfileConfig;
  const layerNames = new Set(
    config.layers.map((layer) => layer.name.toLowerCase()),
  );
  const flagshipRepos = new Set(
    config.flagships.map((project) => project.repo.toLowerCase()),
  );
  const details: string[] = [];
  if (layerNames.size !== config.layers.length)
    details.push("/layers contains duplicate names");
  if (flagshipRepos.size !== config.flagships.length)
    details.push("/flagships contains duplicate repositories");
  if (details.length > 0) {
    throw new ProfileError(
      "CONFIG_INVALID",
      "profile configuration contains duplicate identifiers",
      details,
    );
  }

  return freezeDeep(config);
}
