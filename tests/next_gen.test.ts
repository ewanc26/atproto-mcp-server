// ── Next-Gen Feature Test Suite ───────────────────────────────────────────
// Structural validation for moderation reporting methods and Jetstream
// subscription URL construction. No network calls — pure logic verification.

import { ModerationManager } from "../src/core/moderation.js";
import { StreamingManager } from "../src/core/streaming.js";
import { BskyAgent } from "@atproto/api";

async function runNextGenTests() {
  console.log("Starting Next-Gen Feature Tests (Moderation & Streaming)...");

  const agent = new BskyAgent({ service: "https://bsky.social" });
  const moderation = new ModerationManager(agent);
  const streaming = new StreamingManager(agent);

  try {
    // ── Phase 6: Moderation Method Surface ──────────────────────────────
    console.log("Testing Moderation: Reporting logic...");
    if (typeof moderation.reportRepo !== 'function') throw new Error("reportRepo missing");
    if (typeof moderation.reportRecord !== 'function') throw new Error("reportRecord missing");
    console.log("  PASS: Moderation methods validated");

    // ── Phase 6: Jetstream URL Generation ───────────────────────────────
    console.log("Testing Streaming: Jetstream URL generation...");
    const url = streaming.getJetstreamUrl(['app.bsky.feed.post', 'app.bsky.graph.follow']);
    console.log("  URL:", url);

    if (!url.includes("wss://jetstream1.us-east.bsky.network/subscribe")) {
      throw new Error("Invalid Jetstream base URL");
    }
    if (!url.includes("wantedCollections=app.bsky.feed.post")) {
      throw new Error("Missing collection filter in URL");
    }
    console.log("  PASS: Jetstream URL logic validated");

    console.log("");
    console.log("========================================");
    console.log("NEXT-GEN TESTS PASSED");
    console.log("========================================");

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Next-Gen Test failed:", msg);
    process.exit(1);
  }
}

runNextGenTests();