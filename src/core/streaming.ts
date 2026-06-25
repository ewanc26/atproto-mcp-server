// ── Real-Time Streaming (Jetstream) ────────────────────────────────────────
// Jetstream WebSocket URLs for subscribing to AT Protocol event streams.
// Filters by collection type and optionally by the authenticated user's DID
// for personalised event feeds.

import { BskyAgent } from "@atproto/api";

export class StreamingManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /**
   * Generates a Jetstream subscription URL for real-time event streaming.
   * High-value for 2026: enabling agents to subscribe to specific event types
   * (e.g. mentions or keyword hits) in near real-time.
   */
  getJetstreamUrl(collections: string[] = ['app.bsky.feed.post']) {
    const did = this.agent.session?.did;
    const base = "wss://jetstream1.us-east.bsky.network/subscribe";
    const params = collections.map(c => `wantedCollections=${c}`).join('&');
    // When authenticated, scope the stream to the user's own DID.
    return did ? `${base}?${params}&wantedDids=${did}` : `${base}?${params}`;
  }
}