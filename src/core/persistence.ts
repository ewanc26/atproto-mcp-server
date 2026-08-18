import { Client } from '@atproto/lex';

export interface JetstreamState {
  lastCursor: string;
  activeCollections: string[];
}

export class PersistenceManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
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
