import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { subscribe, unsubscribe } from "./subscribers";
import { MAX_SCHEDULE_MATCHES } from "@arsenal/shared";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CONTENT_TABLE = process.env.DYNAMODB_CONTENT_ITEMS_TABLE ?? "ContentItems";
const MATCHES_TABLE = process.env.DYNAMODB_MATCHES_TABLE ?? "Matches";
const MATCH_EVENTS_TABLE = process.env.DYNAMODB_MATCH_EVENTS_TABLE ?? "MatchEvents";
const LINEUPS_TABLE = process.env.DYNAMODB_LINEUPS_TABLE ?? "Lineups";
const STANDINGS_TABLE = process.env.DYNAMODB_STANDINGS_TABLE ?? "Standings";

interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  queryStringParameters?: Record<string, string> | null;
  pathParameters?: Record<string, string> | null;
  body?: string | null;
}

interface APIResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function jsonResponse(statusCode: number, data: unknown): APIResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    },
    body: JSON.stringify(data),
  };
}

/** GET /content — query content items with optional filters */
async function getContent(params: Record<string, string>): Promise<APIResponse> {
  const date = params.date ?? new Date().toISOString().split("T")[0];
  const limit = Math.min(parseInt(params.limit ?? "20", 10), 100);

  const queryParams: Record<string, unknown> = {
    TableName: CONTENT_TABLE,
    IndexName: "ContentByDate",
    KeyConditionExpression: "aggregationDate = :date",
    ExpressionAttributeValues: { ":date": date } as Record<string, unknown>,
    Limit: limit,
  };

  if (params.contentType) {
    (queryParams as Record<string, unknown>).KeyConditionExpression += " AND contentType = :ct";
    (queryParams.ExpressionAttributeValues as Record<string, unknown>)[":ct"] = params.contentType;
  }

  if (params.sourceCountry) {
    (queryParams as Record<string, unknown>).FilterExpression = "sourceCountry = :sc";
    (queryParams.ExpressionAttributeValues as Record<string, unknown>)[":sc"] = params.sourceCountry;
  }

  if (params.nextToken) {
    (queryParams as Record<string, unknown>).ExclusiveStartKey = JSON.parse(
      Buffer.from(params.nextToken, "base64").toString()
    );
  }

  const result = await docClient.send(new QueryCommand(queryParams as any));

  const nextToken = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
    : undefined;

  return jsonResponse(200, { items: result.Items ?? [], nextToken });
}

/** GET /transfers — query transfer items sorted by date desc */
async function getTransfers(): Promise<APIResponse> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CONTENT_TABLE,
      IndexName: "TransferItems",
      KeyConditionExpression: "isTransfer = :t",
      ExpressionAttributeValues: { ":t": true },
      ScanIndexForward: false,
    })
  );
  return jsonResponse(200, { items: result.Items ?? [] });
}

/** GET /schedule — upcoming matches, limit 10 */
async function getSchedule(): Promise<APIResponse> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: MATCHES_TABLE,
      IndexName: "UpcomingMatches",
      KeyConditionExpression: "#s = :status",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":status": "scheduled" },
      Limit: MAX_SCHEDULE_MATCHES,
      ScanIndexForward: true,
    })
  );
  return jsonResponse(200, { matches: result.Items ?? [] });
}

/** GET /standings — by competition */
async function getStandings(competition?: string): Promise<APIResponse> {
  const comp = competition ?? "Premier League";
  const result = await docClient.send(
    new QueryCommand({
      TableName: STANDINGS_TABLE,
      KeyConditionExpression: "competition = :comp",
      ExpressionAttributeValues: { ":comp": comp },
      ScanIndexForward: true,
    })
  );
  return jsonResponse(200, { standings: result.Items ?? [] });
}

/** GET /match/:id */
async function getMatch(matchId: string): Promise<APIResponse> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: MATCHES_TABLE,
      FilterExpression: "matchId = :id",
      ExpressionAttributeValues: { ":id": matchId },
      Limit: 1,
    })
  );
  const match = result.Items?.[0];
  if (!match) return jsonResponse(404, { error: "Match not found" });
  return jsonResponse(200, match);
}

/** GET /match/:id/lineup */
async function getMatchLineup(matchId: string): Promise<APIResponse> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: LINEUPS_TABLE,
      KeyConditionExpression: "matchId = :id",
      ExpressionAttributeValues: { ":id": matchId },
    })
  );
  return jsonResponse(200, { lineups: result.Items ?? [] });
}

/** GET /match/:id/timeline */
async function getMatchTimeline(matchId: string): Promise<APIResponse> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: MATCH_EVENTS_TABLE,
      KeyConditionExpression: "matchId = :id",
      ExpressionAttributeValues: { ":id": matchId },
    })
  );
  const events = (result.Items ?? []).sort(
    (a, b) => (a.minute as number) - (b.minute as number)
  );
  return jsonResponse(200, { events });
}

/** Main API handler */
export async function handler(event: APIGatewayEvent): Promise<APIResponse> {
  const { httpMethod, path } = event;
  const params = event.queryStringParameters ?? {};
  const pathParams = event.pathParameters ?? {};

  try {
    // Route matching
    if (httpMethod === "GET" && path === "/content") {
      return await getContent(params);
    }
    if (httpMethod === "GET" && path.match(/^\/content\/[^/]+$/)) {
      const id = pathParams.id ?? path.split("/").pop()!;
      const result = await docClient.send(
        new GetCommand({ TableName: CONTENT_TABLE, Key: { contentId: id } })
      );
      if (!result.Item) return jsonResponse(404, { error: "Content not found" });
      return jsonResponse(200, result.Item);
    }
    if (httpMethod === "GET" && path === "/transfers") {
      return await getTransfers();
    }
    if (httpMethod === "GET" && path === "/schedule") {
      return await getSchedule();
    }
    if (httpMethod === "GET" && path === "/standings") {
      return await getStandings(params.competition);
    }
    if (httpMethod === "GET" && path.match(/^\/match\/[^/]+$/)) {
      const id = pathParams.id ?? path.split("/")[2];
      return await getMatch(id);
    }
    if (httpMethod === "GET" && path.match(/^\/match\/[^/]+\/lineup$/)) {
      const id = pathParams.id ?? path.split("/")[2];
      return await getMatchLineup(id);
    }
    if (httpMethod === "GET" && path.match(/^\/match\/[^/]+\/timeline$/)) {
      const id = pathParams.id ?? path.split("/")[2];
      return await getMatchTimeline(id);
    }
    if (httpMethod === "POST" && path === "/subscribe") {
      const body = JSON.parse(event.body ?? "{}");
      const result = await subscribe(body.email);
      return jsonResponse(result.success ? 200 : 400, result);
    }
    if (httpMethod === "DELETE" && path === "/subscribe") {
      const body = JSON.parse(event.body ?? "{}");
      const result = await unsubscribe(body.email, body.token);
      return jsonResponse(result.success ? 200 : 400, result);
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "ERROR",
        service: "api",
        message: "Request failed",
        metadata: { path, method: httpMethod, error: error instanceof Error ? error.message : String(error) },
      })
    );
    return jsonResponse(500, { error: "Internal server error" });
  }
}
