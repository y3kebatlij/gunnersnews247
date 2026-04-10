import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { Subscriber } from "@arsenal/shared";
import { randomBytes } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_SUBSCRIBERS_TABLE ?? "Subscribers";

/** Validate email format using a reasonable regex */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  // RFC 5322 simplified — covers the vast majority of valid emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/** Generate a unique unsubscribe token */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Subscribe an email address to the daily digest */
export async function subscribe(email: string): Promise<{ success: boolean; error?: string }> {
  if (!validateEmail(email)) {
    return { success: false, error: "Invalid email format" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const token = generateToken();

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        email: normalizedEmail,
        subscribedAt: new Date().toISOString(),
        active: true,
        unsubscribeToken: token,
      } satisfies Subscriber & { unsubscribeToken: string },
    })
  );

  return { success: true };
}

/** Unsubscribe an email using the provided token */
export async function unsubscribe(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Verify token matches
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { email: normalizedEmail },
    })
  );

  if (!result.Item) {
    return { success: false, error: "Subscriber not found" };
  }

  if (result.Item.unsubscribeToken !== token) {
    return { success: false, error: "Invalid unsubscribe token" };
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { email: normalizedEmail },
      UpdateExpression: "SET active = :active",
      ExpressionAttributeValues: { ":active": false },
    })
  );

  return { success: true };
}
