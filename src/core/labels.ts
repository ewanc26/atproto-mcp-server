// ── Custom Labels ──────────────────────────────────────────────────────────
// Self-label construction and label definition queries against AT Protocol
// label services. Supports moderation-tool integration workflows.

import { BskyAgent } from "@atproto/api";

export class CustomLabelManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /** Format label values for inclusion in a post's self-labels array. */
  async applySelfLabel(labels: string[]) {
    return labels.map(val => ({ val }));
  }

  /** Query known label definitions by fuzzy URI pattern matching. */
  async getLabelDefinitions(labelValues: string[]) {
    return await this.agent.atproto.label.queryLabels({
      uriPatterns: labelValues.map(v => `*${v}*`)
    });
  }
}