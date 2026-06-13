import { BskyAgent } from "@atproto/api";

export class ModerationManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async reportRepo(did: string, reasonType: string, reason?: string) {
    return await this.agent.com.atproto.moderation.createReport({
      subject: {
        $type: 'com.atproto.admin.defs#repoRef',
        did: did,
      },
      reasonType,
      reason,
    });
  }

  async reportRecord(uri: string, cid: string, reasonType: string, reason?: string) {
    return await this.agent.com.atproto.moderation.createReport({
      subject: {
        $type: 'com.atproto.repo.strongRef',
        uri,
        cid,
      },
      reasonType,
      reason,
    });
  }

  async getLabels(uri: string) {
    return await this.agent.atproto.label.queryLabels({
      uriPatterns: [uri]
    });
  }
}