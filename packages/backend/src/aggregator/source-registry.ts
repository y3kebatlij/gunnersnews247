import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { SourceRegistryEntry } from "@arsenal/shared";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_SOURCE_REGISTRY_TABLE ?? "SourceRegistry";

/** Validate a single Source Registry entry has all required fields and a valid URL */
export function validateRegistryEntry(entry: Partial<SourceRegistryEntry>): entry is SourceRegistryEntry {
  if (!entry.name || typeof entry.name !== "string") return false;
  if (!entry.url || typeof entry.url !== "string") return false;
  if (!entry.country || typeof entry.country !== "string") return false;
  if (!entry.contentType || typeof entry.contentType !== "string") return false;
  if (typeof entry.crawlPriority !== "number" || entry.crawlPriority < 1) return false;

  try {
    new URL(entry.url);
  } catch {
    return false;
  }

  const validTypes = ["article", "blog", "newspaper", "podcast", "video"];
  if (!validTypes.includes(entry.contentType)) return false;

  return true;
}

/** Load all enabled sources from the Source Registry DynamoDB table */
export async function loadSourceRegistry(): Promise<SourceRegistryEntry[]> {
  const validEntries: SourceRegistryEntry[] = [];

  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "enabled = :enabled",
      ExpressionAttributeValues: { ":enabled": true },
    })
  );

  const items = (result.Items ?? []) as Partial<SourceRegistryEntry>[];

  for (const item of items) {
    if (validateRegistryEntry(item)) {
      validEntries.push(item);
    } else {
      console.warn(
        JSON.stringify({
          level: "WARN",
          service: "aggregator",
          message: "Invalid source registry entry — skipping",
          metadata: { sourceId: (item as Record<string, unknown>).sourceId, url: (item as Record<string, unknown>).url },
        })
      );
    }
  }

  return validEntries.sort((a, b) => a.crawlPriority - b.crawlPriority);
}
