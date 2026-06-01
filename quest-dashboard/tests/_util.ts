import type { Result } from "../src/types";

// Unwrap a successful Result for assertions. If the Result is an error, the
// returned value is undefined and the downstream assertion fails loudly.
export function unwrap<T>(result: Result<T>): T {
  return (result as Extract<Result<T>, { ok: true }>).value;
}
