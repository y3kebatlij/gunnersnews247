import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { ContentItemInput, SourceRegistryEntry } from "@arsenal/shared";
import { loadSourceRegistry } from "./source-registry";
import { computeDurationLabel } from "./duration";
import { generateSummary } from "./summary";
import { classifyTransferItem } from "./transfer-classifier";
import { parseRSSFeed } from "./rss-parser";
import { scrapeWebPage } from "./web-scraper";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CONTENT_TABLE = process.env.DYNAMODB_CONTENT_ITEMS_TABLE ?? "ContentItems";

interface AggregatorEvent {
  source: "eventbridge";
  detail: { cycle: "daily" };
}

/** Generate a simple unique ID */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Crawl a single source using the appropriate method (RSS or web scrape).
 * The feedType is inferred from the source's URL and content type.
 */
async function crawlSource(source: SourceRegistryEntry): Promise<ContentItemInput[]> {
  console.log(
    JSON.stringify({
      level: "INFO",
      service: "aggregator",
      message: `Crawling source: ${source.name}`,
      metadata: { sourceId: source.sourceId, url: source.url },
    })
  );

  // Determine crawl method: RSS feeds for most sources, web scrape as fallback
  const isRSSUrl = source.url.includes("/rss") ||
    source.url.includes("/feed") ||
    source.url.endsWith(".xml") ||
    source.url.includes("rss.xml");

  if (isRSSUrl || source.contentType === "podcast") {
    return parseRSSFeed(
      source.url,
      source.name,
      source.country,
      source.contentType
    );
  }

  // Web scrape fallback — returns single item or empty
  const item = await scrapeWebPage(
    source.url,
    source.name,
    source.country,
    source.contentType
  );
  return item ? [item] : [];
}

/** Persist a single content item to DynamoDB */
async function storeContentItem(
  item: ContentItemInput,
  aggregationDate: string,
  transferInfo: { isTransfer: boolean; transferType: string | null }
): Promise<void> {
  const durationLabel = computeDurationLabel(
    item.contentType,
    item.rawWordCount,
    item.rawDurationSeconds
  );

  await docClient.send(
    new PutCommand({
      TableName: CONTENT_TABLE,
      Item: {
        contentId: generateId(),
        aggregationDate,
        sourceUrl: item.sourceUrl,
        title: item.title,
        summary: item.summary,
        publicationDate: item.publicationDate,
        sourceName: item.sourceName,
        sourceCountry: item.sourceCountry,
        contentType: item.contentType,
        durationMinutes: item.estimatedDurationMinutes,
        durationLabel,
        isTransfer: transferInfo.isTransfer,
        transferType: transferInfo.transferType,
        createdAt: new Date().toISOString(),
      },
    })
  );
}

/** Main aggregator handler — triggered daily by EventBridge */
export async function handler(_event: AggregatorEvent): Promise<void> {
  const aggregationDate = new Date().toISOString().split("T")[0];

  console.log(
    JSON.stringify({
      level: "INFO",
      service: "aggregator",
      message: "Starting daily aggregation cycle",
      metadata: { aggregationDate },
    })
  );

  const sources = await loadSourceRegistry();
  let successCount = 0;
  let failCount = 0;
  let itemCount = 0;

  for (const source of sources) {
    try {
      const items = await crawlSource(source);

      for (const item of items) {
        const summary = generateSummary(item.summary);
        const transferClassification = classifyTransferItem(item.title, summary);

        await storeContentItem(
          { ...item, summary },
          aggregationDate,
          {
            isTransfer: transferClassification !== null,
            transferType: transferClassification?.transferType ?? null,
          }
        );
        itemCount++;
      }

      successCount++;
    } catch (error) {
      failCount++;
      console.error(
        JSON.stringify({
          level: "ERROR",
          service: "aggregator",
          message: "Failed to crawl source — skipping",
          metadata: {
            sourceId: source.sourceId,
            url: source.url,
            error: error instanceof Error ? error.message : String(error),
          },
        })
      );
    }
  }

  console.log(
    JSON.stringify({
      level: "INFO",
      service: "aggregator",
      message: "Aggregation cycle complete",
      metadata: { successCount, failCount, totalSources: sources.length, itemCount },
    })
  );
}
