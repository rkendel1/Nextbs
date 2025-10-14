// src/lib/brandManager.ts
import crawler from "./crawler";
import llmService from "./llm";
import { v4 as uuidv4 } from "uuid";

type BrandSnapshot = {
  id: string;
  version: string;
  structure: any;
  designTokens: any;
  brandVoice: any;
  meta: any;
  screenshot?: string;
  createdAt: string;
};

class BrandManagerService {
  private snapshots: Record<string, BrandSnapshot[]> = {};

  // Capture brand snapshot from URL
  async captureBrand(url: string): Promise<BrandSnapshot> {
    const crawlResult = await crawler.crawl(url, { takeScreenshot: true });

    const colors = crawler.extractMajorColors(crawlResult.computedStyles);
    const fonts = crawler.extractMajorFonts(crawlResult.computedStyles);
    const spacing = crawler.extractSpacingScale(crawlResult.computedStyles);

    // Use LLM to summarize brand voice
    const brandVoice = await llmService.summarizeBrandVoice(crawlResult.textContent);

    const snapshot: BrandSnapshot = {
      id: uuidv4(),
      version: "v1",
      structure: crawlResult.structuredData,
      designTokens: {
        colors,
        fonts,
        spacing,
        borderRadius: crawlResult.computedStyles.borderRadius,
        shadows: crawlResult.computedStyles.shadows,
        cssVariables: crawlResult.cssVariables,
      },
      brandVoice,
      meta: crawlResult.meta,
      screenshot: crawlResult.screenshot?.toString("base64"),
      createdAt: new Date().toISOString(),
    };

    if (!this.snapshots[crawlResult.domain]) this.snapshots[crawlResult.domain] = [];
    this.snapshots[crawlResult.domain].push(snapshot);

    return snapshot;
  }

  // Get latest or specific version
  getSnapshot(domain: string, version?: string): BrandSnapshot | null {
    const versions = this.snapshots[domain];
    if (!versions || versions.length === 0) return null;
    if (!version) return versions[versions.length - 1];
    return versions.find(v => v.version === version) || null;
  }

  // LLM-assisted edit using natural language command
  async editSnapshot(domain: string, userCommand: string): Promise<BrandSnapshot> {
    const snapshot = this.getSnapshot(domain);
    if (!snapshot) throw new Error("Brand snapshot not found");

    // Call LLM to interpret command and return structured JSON edits
    const suggestedEdits = await llmService.callLLM(
      `Given the current brand snapshot, apply the following changes:\n"${userCommand}"\nReturn updated designTokens and brandVoice in JSON format.`,
      'You are a brand manager AI. Interpret natural language instructions and output JSON edits with keys: designTokens, brandVoice.',
      { type: 'json_object' }
    );

    // Merge edits into a new version
    const newVersionNumber = `v${(this.snapshots[domain].length + 1).toString()}`;
    const newSnapshot: BrandSnapshot = {
      ...snapshot,
      version: newVersionNumber,
      designTokens: { ...snapshot.designTokens, ...suggestedEdits.designTokens },
      brandVoice: { ...snapshot.brandVoice, ...suggestedEdits.brandVoice },
      createdAt: new Date().toISOString(),
    };

    this.snapshots[domain].push(newSnapshot);
    return newSnapshot;
  }

  // Approve / activate version
  approveSnapshot(domain: string, version: string): BrandSnapshot | null {
    const snapshot = this.getSnapshot(domain, version);
    if (!snapshot) return null;
    // Could store an "activeVersion" flag in production DB
    return snapshot;
  }
}

export default new BrandManagerService();