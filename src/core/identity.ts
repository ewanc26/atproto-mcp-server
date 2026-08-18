import { Client } from '@atproto/lex';
import { com } from '@bsky/sdk/lexicons';

export class IdentityManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async resolveAccountInfo(handle: string) {
    const didResult = await this.client.call(com.atproto.identity.resolveHandle, { handle });
    const did = didResult.did;
    const description = await this.client.call(com.atproto.repo.describeRepo, { repo: did });
    return {
      did,
      handle,
      collections: description.collections
    };
  }

  async getOAuthMetadata(pdsUrl: string) {
    return {
      issuer: pdsUrl,
      authorization_endpoint: `${pdsUrl}/oauth/authorize`,
      token_endpoint: `${pdsUrl}/oauth/token`,
      scopes_supported: ['atproto', 'transition']
    };
  }
}
