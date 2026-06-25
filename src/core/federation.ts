// ── Federation Status ──────────────────────────────────────────────────────
// PDS (Personal Data Server) health checks and protocol-level server
// introspection. Useful for verifying connectivity before issuing operations.

import { BskyAgent } from "@atproto/api";

export class FederationManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /** Probe the PDS via the protocol's describeServer endpoint. */
  async inspectPdsStatus(pdsUrl: string) {
    try {
      return await this.agent.com.atproto.server.describeServer();
    } catch (e) {
      return { status: 'unreachable', error: String(e) };
    }
  }
}