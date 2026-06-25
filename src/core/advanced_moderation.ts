// ── Advanced Moderation (Ozone) ────────────────────────────────────────────
// Cross-labeler label queries and Ozone labeler profile lookups.
// Used for multi-source moderation verification — querying several labelers
// simultaneously to build a composite view of a subject's status.

import { BskyAgent } from "@atproto/api";

export class AdvancedModerationManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /** Query labels for a subject across multiple labelers in parallel. */
  async queryOzoneLabels(subject: string, labelers: string[]) {
    const responses = await Promise.all(labelers.map(did =>
      this.agent.atproto.label.queryLabels({
        uriPatterns: [subject],
        sources: [did]
      })
    ));
    return responses.map(r => r.data.labels).flat();
  }

  /** Fetch a labeler's service metadata, including its configured policies. */
  async getLabelerProfile(did: string) {
    return await this.agent.app.bsky.labeler.getServices({
      dids: [did],
      detailed: true
    });
  }
}