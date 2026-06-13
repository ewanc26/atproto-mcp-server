import { BskyAgent } from "@atproto/api";

export class AdvancedModerationManager {
  private agent: BskyAgent;

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  async queryOzoneLabels(subject: string, labelers: string[]) {
    const responses = await Promise.all(labelers.map(did => 
      this.agent.atproto.label.queryLabels({
        uriPatterns: [subject],
        sources: [did]
      })
    ));
    return responses.map(r => r.data.labels).flat();
  }

  async getLabelerProfile(did: string) {
    return await this.agent.app.bsky.labeler.getServices({
      dids: [did],
      detailed: true
    });
  }
}