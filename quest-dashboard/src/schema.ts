import { SUPPORTED_VERSION } from "./types";

export type SchemaStatus =
  | { ok: true }
  | { ok: false; reason: "missing" | "unsupported_version"; found: string | null };

// Single choke-point for schema-version compatibility. quest-system uses calver
// YYYY.MM.NNNN. We accept any patch (NNNN) within the supported YYYY.MM, and
// reject on year/month drift — that is where field renames land.
export function checkSchemaVersion(found: string | null): SchemaStatus {
  if (found === null || found.trim() === "") {
    return { ok: false, reason: "missing", found };
  }

  const supported = yearMonth(SUPPORTED_VERSION);
  const candidate = yearMonth(found.trim());

  if (candidate === null || candidate !== supported) {
    return { ok: false, reason: "unsupported_version", found };
  }

  return { ok: true };
}

function yearMonth(version: string): string | null {
  const match = /^(\d{4})\.(\d{2})\.\d+$/.exec(version);
  return match ? `${match[1]}.${match[2]}` : null;
}
