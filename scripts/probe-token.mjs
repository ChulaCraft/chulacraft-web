#!/usr/bin/env node
// Prints one 60 s manager token carrying a single permission bit, minted with the
// website's own mintToken (src/lib/mcsv-token.ts). For the Gate 2 token probe:
//
//   MCSV_JWT_PRIVATE_KEY=<production key> node scripts/probe-token.mjs status
//   TOKEN=$(MCSV_JWT_PRIVATE_KEY=... node scripts/probe-token.mjs status)
//
// The token goes to stdout, everything else to stderr. The key is only read from
// the environment and is never printed.
import { PERMISSION, mintToken } from "../src/lib/mcsv-token.ts";

const name = (process.argv[2] ?? "").toUpperCase();
if (!Object.hasOwn(PERMISSION, name)) {
  console.error(`usage: probe-token.mjs <${Object.keys(PERMISSION).join("|").toLowerCase()}>`);
  process.exit(2);
}
if (!process.env.MCSV_JWT_PRIVATE_KEY) {
  console.error("MCSV_JWT_PRIVATE_KEY is not set in the environment.");
  process.exit(2);
}
try {
  console.log(mintToken("probe-token", PERMISSION[name]));
} catch {
  console.error("Could not sign: MCSV_JWT_PRIVATE_KEY is not a usable Ed25519 private key.");
  process.exit(1);
}
