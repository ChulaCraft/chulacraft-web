import { createHash, createPrivateKey } from "node:crypto";

// TEST ONLY: a fixed Ed25519 key so the Next server (signs) and the manager mock
// (verifies) agree across reused servers. Derived from a public seed, so it is
// worthless outside the visual tests.
const seed = createHash("sha256").update("chulacraft-visual-tests").digest();
const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
export const visualManagerKey = createPrivateKey({ key: der, format: "der", type: "pkcs8" }).export({ type: "pkcs8", format: "pem" }).toString();
