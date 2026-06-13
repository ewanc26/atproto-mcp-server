import { BskyAgent } from "@atproto/api";

export class IdentityManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async resolveAccountInfo(handle: string) {
    const did = await this.agent.resolveHandle({ handle });
    const description = await this.agent.com.atproto.repo.describeRepo({ repo: did.data.did });
    return {
      did: did.data.did,
      handle,
      collections: description.data.collections
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