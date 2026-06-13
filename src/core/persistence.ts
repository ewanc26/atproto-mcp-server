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

  async getPersistentSubscription(cursor?: string) {
    const base = "wss://jetstream1.us-east.bsky.network/subscribe";
    const collections = ['app.bsky.feed.post', 'app.bsky.graph.follow'];
    const params = collections.map(c => `wantedCollections=${c}`).join('&');
    
    return cursor 
      ? `${base}?${params}&cursor=${cursor}`
      : `${base}?${params}`;
  }
}