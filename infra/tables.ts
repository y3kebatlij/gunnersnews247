/**
 * DynamoDB table definitions for the Arsenal News Aggregator.
 * All 8 tables with keys and GSIs as specified in the design document.
 */

export interface TableDefinition {
  tableName: string;
  partitionKey: { name: string; type: "S" | "N" };
  sortKey?: { name: string; type: "S" | "N" };
  gsis?: GSIDefinition[];
  ttlAttribute?: string;
}

export interface GSIDefinition {
  indexName: string;
  partitionKey: { name: string; type: "S" | "N" | "BOOL" };
  sortKey?: { name: string; type: "S" | "N" };
}

export const TABLES: TableDefinition[] = [
  {
    tableName: "ContentItems",
    partitionKey: { name: "contentId", type: "S" },
    sortKey: { name: "aggregationDate", type: "S" },
    gsis: [
      {
        indexName: "ContentByDate",
        partitionKey: { name: "aggregationDate", type: "S" },
        sortKey: { name: "contentType", type: "S" },
      },
      {
        indexName: "TransferItems",
        partitionKey: { name: "isTransfer", type: "S" },
        sortKey: { name: "publicationDate", type: "S" },
      },
    ],
  },
  {
    tableName: "Subscribers",
    partitionKey: { name: "email", type: "S" },
  },
  {
    tableName: "SourceRegistry",
    partitionKey: { name: "sourceId", type: "S" },
  },
  {
    tableName: "Matches",
    partitionKey: { name: "matchId", type: "S" },
    sortKey: { name: "matchDate", type: "S" },
    gsis: [
      {
        indexName: "UpcomingMatches",
        partitionKey: { name: "status", type: "S" },
        sortKey: { name: "kickoffTime", type: "S" },
      },
    ],
  },
  {
    tableName: "MatchEvents",
    partitionKey: { name: "matchId", type: "S" },
    sortKey: { name: "eventId", type: "S" },
  },
  {
    tableName: "Lineups",
    partitionKey: { name: "matchId", type: "S" },
    sortKey: { name: "teamSide", type: "S" },
  },
  {
    tableName: "Standings",
    partitionKey: { name: "competition", type: "S" },
    sortKey: { name: "position", type: "N" },
  },
  {
    tableName: "WebSocketConnections",
    partitionKey: { name: "connectionId", type: "S" },
    ttlAttribute: "ttl",
  },
];
