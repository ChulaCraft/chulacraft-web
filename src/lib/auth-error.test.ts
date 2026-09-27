import { describe, expect, it } from "vitest";
import {
  authFailureMessage,
  classifyOAuthCallbackFailure,
  safeAuthFailureReason
} from "./auth-error";

describe("OAuth failure handling", () => {
  it("distinguishes a user cancellation from provider failures", () => {
    expect(classifyOAuthCallbackFailure("access_denied", null)).toBe("cancelled");
    expect(classifyOAuthCallbackFailure("server_error", "unexpected_failure")).toBe("provider_error");
    expect(classifyOAuthCallbackFailure(null, null)).toBe("callback_missing_code");
    expect(classifyOAuthCallbackFailure("server_error", "unexpected_failure", "Error running hook URI: REGISTER_DISCORD_FIRST")).toBe("register_discord_first");
    expect(classifyOAuthCallbackFailure("server_error", "identity_already_exists")).toBe("already_linked");
  });

  it("does not reflect arbitrary callback values into the error page", () => {
    expect(safeAuthFailureReason("session_exchange_failed")).toBe("session_exchange_failed");
    expect(safeAuthFailureReason("<script>alert(1)</script>")).toBe("provider_error");
    expect(authFailureMessage(safeAuthFailureReason("<script>alert(1)</script>"))).not.toContain("<script>");
  });

  it("accepts every known reason", () => {
    for (const reason of ["cancelled", "provider_error", "callback_missing_code", "session_exchange_failed", "start_failed",
      "register_discord_first", "already_linked", "discord_required", "other"]) {
      expect(safeAuthFailureReason(reason)).toBe(reason);
    }
    expect(safeAuthFailureReason(undefined)).toBe("provider_error");
    expect(safeAuthFailureReason("toString")).toBe("provider_error");
  });
});
