import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import type { NotificationPayload } from "@arsenal/shared";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const CONNECTIONS_TABLE =
  process.env.DYNAMODB_WEBSOCKET_CONNECTIONS_TABLE ?? "WebSocketConnections";
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_API_URL ?? "";

interface WebSocketEvent {
  requestContext: {
    routeKey: "$connect" | "$disconnect" | "sendMessage";
    connectionId: string;
    domainName?: string;
    stage?: string;
  };
  body?: string;
}

/** Handle new WebSocket connection */
async function onConnect(connectionId: string): Promise<void> {
  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h TTL
  await docClient.send(
    new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    })
  );
}

/** Handle WebSocket disconnection */
async function onDisconnect(connectionId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    })
  );
}

/** Broadcast a notification payload to all connected clients */
export async function broadcast(payload: NotificationPayload): Promise<void> {
  const endpoint = WEBSOCKET_ENDPOINT.replace("wss://", "https://");
  const apiClient = new ApiGatewayManagementApiClient({ endpoint });

  const result = await docClient.send(
    new ScanCommand({ TableName: CONNECTIONS_TABLE })
  );

  const connections = result.Items ?? [];
  const message = JSON.stringify(payload);

  for (const conn of connections) {
    const connId = conn.connectionId as string;
    try {
      await apiClient.send(
        new PostToConnectionCommand({
          ConnectionId: connId,
          Data: new TextEncoder().encode(message),
        })
      );
    } catch (error: unknown) {
      // Remove stale connections
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 410) {
        await docClient.send(
          new DeleteCommand({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId: connId },
          })
        );
      } else {
        console.warn(
          JSON.stringify({
            level: "WARN",
            service: "realtime",
            message: "Failed to send to connection",
            metadata: { connectionId: connId },
          })
        );
      }
    }
  }
}

/** Main WebSocket handler */
export async function handler(
  event: WebSocketEvent
): Promise<{ statusCode: number }> {
  const { routeKey, connectionId } = event.requestContext;

  switch (routeKey) {
    case "$connect":
      await onConnect(connectionId);
      break;
    case "$disconnect":
      await onDisconnect(connectionId);
      break;
    case "sendMessage":
      // Clients don't send messages in this architecture
      break;
  }

  return { statusCode: 200 };
}
