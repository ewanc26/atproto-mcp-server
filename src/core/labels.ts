import { BskyAgent } from "@atproto/api";

export class CustomLabelManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async applySelfLabel(labels: string[]) {
    return labels.map(val => ({ val }));
  }

  async getLabelDefinitions(labelValues: string[]) {
    return await this.agent.atproto.label.queryLabels({
      uriPatterns: labelValues.map(v => `*${v}*`)
    });
  }
}