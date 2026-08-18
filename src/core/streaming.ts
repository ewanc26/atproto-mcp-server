import { Client } from '@atproto/lex';

export class StreamingManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  getJetstreamUrl(collections: string[] = ['app.bsky.feed.post']) {
    const did = this.client.did;
    const base = "wss://jetstream1.us-east.bsky.network/subscribe";
    const params = collections.map(c => `wantedCollections=${c}`).join('&');
    return did ? `${base}?${params}&wantedDids=${did}` : `${base}?${params}`;
  }
}
