/** Every admin/registration RPC signals a failure with `raise exception 'CODE'`,
 *  so the whole message is the code — anything else is an unexpected DB error. */
const CODE = /^[A-Z][A-Z0-9_]*$/;

/** The error's database code, or null when the message isn't exactly one. */
export function dbErrorCode(error: { message?: unknown } | null | undefined): string | null {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  return CODE.test(message) ? message : null;
}