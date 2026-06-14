import { BskyAgent } from "@atproto/api";

export class FederationManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async inspectPdsStatus(pdsUrl: string) {
    try {
      // Use protocol-native server description
      return await this.agent.com.atproto.server.describeServer();
    } catch (e) {
      return { status: 'unreachable', error: String(e) };
    }
  }
}