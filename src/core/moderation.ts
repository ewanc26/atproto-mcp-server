// ── Moderation (Reporting) ─────────────────────────────────────────────────
// AT Protocol moderation primitives: repo-level and record-level reports,
// plus label queries. Maps to com.atproto.moderation.createReport and
// com.atproto.label.queryLabels.

import { BskyAgent } from "@atproto/api";

export class ModerationManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /** Report an entire repository (a user's account) to the moderation service. */
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

  /** Report a specific record (a single post, list item, etc.) for review. */
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

  /** Query all labels currently applied to a given URI. */
  async getLabels(uri: string) {
    return await this.agent.atproto.label.queryLabels({
      uriPatterns: [uri]
    });
  }
}