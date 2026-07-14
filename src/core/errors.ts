export type ProfileErrorCode =
  | "CONFIG_NOT_FOUND"
  | "CONFIG_PARSE_FAILED"
  | "CONFIG_INVALID"
  | "CONFIG_EXISTS"
  | "GITHUB_REQUEST_FAILED"
  | "GITHUB_PAGINATION_FAILED"
  | "GITHUB_PROFILE_EMPTY"
  | "OUTPUT_EXISTS"
  | "OUTPUT_WRITE_FAILED"
  | "OUTPUT_INVALID"
  | "PREVIEW_FAILED"
  | "UNEXPECTED";

export class ProfileError extends Error {
  readonly code: ProfileErrorCode;
  readonly details?: readonly string[];

  constructor(
    code: ProfileErrorCode,
    message: string,
    details?: readonly string[],
  ) {
    super(message);
    this.name = "ProfileError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export function asProfileError(error: unknown): ProfileError {
  if (error instanceof ProfileError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new ProfileError("UNEXPECTED", message);
}
