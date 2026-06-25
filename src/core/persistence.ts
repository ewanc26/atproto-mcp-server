// ── Persistence / Jetstream Subscriptions ──────────────────────────────────
// Jetstream WebSocket URL construction for real-time feed and graph
// event streams. The cursor parameter enables resumable subscriptions from
// the last known position, covering disconnects gracefully.

import { BskyAgent } from "@atproto/api";

export interface JetstreamState {
  lastCursor: string;
  activeCollections: string[];
}

export class PersistenceManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /**
   * Build a Jetstream subscription URL, optionally resuming from a cursor.
   * Defaults to subscribing to posts and follows — the two most common
   * collections for real-time agent workflows.
   */
  async getPersistentSubscription(cursor?: string) {
    const base = "wss://jetstream1.us-east.bsky.network/subscribe";
    const collections = ['app.bsky.feed.post', 'app.bsky.graph.follow'];
    const params = collections.map(c => `wantedCollections=${c}`).join('&');

    return cursor
      ? `${base}?${params}&cursor=${cursor}`
      : `${base}?${params}`;
  }
}