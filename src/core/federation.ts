import { Client } from '@atproto/lex';
import { com } from '@bsky/sdk/lexicons';

export class FederationManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async inspectPdsStatus(pdsUrl: string) {
    try {
      return await this.client.call(com.atproto.server.describeServer);
    } catch (e) {
      return { status: 'unreachable', error: String(e) };
    }
  }
}
