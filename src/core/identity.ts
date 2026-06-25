// ── Identity Resolution ────────────────────────────────────────────────────
// Handle-to-DID resolution, repo introspection, and OAuth metadata
// construction. Spec: https://atproto.com/specs/did

import { BskyAgent } from "@atproto/api";

export class IdentityManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /** Resolve a handle to a DID and return the account's repo collection list. */
  async resolveAccountInfo(handle: string) {
    const did = await this.agent.resolveHandle({ handle });
    const description = await this.agent.com.atproto.repo.describeRepo({ repo: did.data.did });
    return {
      did: did.data.did,
      handle,
      collections: description.data.collections
    };
  }

  /** Build OAuth 2.0 metadata for a given PDS, scoped to AT Protocol flows. */
  async getOAuthMetadata(pdsUrl: string) {
    return {
      issuer: pdsUrl,
      authorization_endpoint: `${pdsUrl}/oauth/authorize`,
      token_endpoint: `${pdsUrl}/oauth/token`,
      // Spec: https://atproto.com/specs/oauth#scopes
      scopes_supported: ['atproto', 'transition']
    };
  }
}