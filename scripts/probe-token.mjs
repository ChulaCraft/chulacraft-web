#!/usr/bin/env node
// Prints one 60 s manager token carrying a single permission bit, minted with the
// website's own mintToken (src/lib/mcsv-token.ts). For the Gate 2 token probe:
//
//   # key in a 0600 file (the PEM is multi-line; `read` would take only its first line):
//   MCSV_JWT_PRIVATE_KEY="$(cat /path/key.pem)" node scripts/probe-token.mjs status
//   # or paste with no echo, then Ctrl-D on an empty line:
//   stty -echo; MCSV_JWT_PRIVATE_KEY="$(cat)"; stty echo; export MCSV_JWT_PRIVATE_KEY
//   node scripts/probe-token.mjs status
//   # the one-line form with literal \n between the PEM lines also works.
//
// Never put the key on the command line: it would land in shell history and `ps`.
// Do not use `read -rs` for a PEM: it stops at the first newline and the rest of a
// paste runs in your shell as commands.
//
// The token goes to stdout, everything else to stderr. The key is only read from
// the environment and is never printed.
import { PERMISSION, mintToken } from "../src/lib/mcsv-token.ts";

const name = (process.argv[2] ?? "").toUpperCase();
if (!Object.hasOwn(PERMISSION, name)) {
  console.error(`usage: probe-token.mjs <${Object.keys(PERMISSION).join("|").toLowerCase()}>`);
  process.exit(2);
}
if (!process.env.MCSV_JWT_PRIVATE_KEY?.trim()) {
  console.error("No key: MCSV_JWT_PRIVATE_KEY is not set or is empty, so no token could be signed.");
  process.exit(2);
}
try {
  console.log(mintToken("probe-token", PERMISSION[name]));
} catch {
  console.error("Could not sign a token: MCSV_JWT_PRIVATE_KEY is not a usable Ed25519 private key.");
  process.exit(1);
}
