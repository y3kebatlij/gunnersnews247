import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { DailyDigest, DigestItem, Subscriber } from "@arsenal/shared";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const sesClient = new SESClient({});

const CONTENT_TABLE = process.env.DYNAMODB_CONTENT_ITEMS_TABLE ?? "ContentItems";
const SUBSCRIBERS_TABLE = process.env.DYNAMODB_SUBSCRIBERS_TABLE ?? "Subscribers";
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL ?? "noreply@example.com";
const API_URL = process.env.API_GATEWAY_URL ?? "https://example.com";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

interface DigestEvent {
  source: "eventbridge";
  detail: { schedule: "daily-digest" };
}

/** Query today's content items from DynamoDB */
async function getTodaysContent(date: string): Promise<DigestItem[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CONTENT_TABLE,
      IndexName: "ContentByDate",
      KeyConditionExpression: "aggregationDate = :date",
      ExpressionAttributeValues: { ":date": date },
    })
  );

  return (result.Items ?? []).map((item) => ({
    title: item.title as string,
    summary: item.summary as string,
    durationLabel: item.durationLabel as string,
    sourceUrl: item.sourceUrl as string,
    sourceName: item.sourceName as string,
    contentType: item.contentType as string,
  }));
}

/** Get all active subscribers */
async function getActiveSubscribers(): Promise<Subscriber[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: SUBSCRIBERS_TABLE,
      FilterExpression: "active = :active",
      ExpressionAttributeValues: { ":active": true },
    })
  );

  return (result.Items ?? []) as Subscriber[];
}

/** Compile content items into a Daily Digest */
export function compileDigest(items: DigestItem[], date: string): DailyDigest {
  return { date, items };
}

/** Render the digest as an HTML email */
export function renderDigestEmail(digest: DailyDigest, unsubscribeUrl: string): string {
  const itemsHtml = digest.items
    .map(
      (item: DigestItem) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #ddd;">
          <a href="${item.sourceUrl}" style="color:#1a4480;font-weight:bold;">${item.title}</a>
          <span style="color:#71767a;font-size:0.85em;"> (${item.durationLabel})</span>
          <br/>
          <span style="color:#71767a;font-size:0.85em;">${item.sourceName} · ${item.contentType}</span>
          <br/>
          <span style="font-size:0.95em;">${item.summary}</span>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Arsenal Daily Digest — ${digest.date}</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="color:#EF0107;">Arsenal Daily Digest</h1>
  <p>${digest.date} — ${digest.items.length} stories</p>
  <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
  <hr style="margin-top:24px;"/>
  <p style="font-size:0.8em;color:#71767a;">
    <a href="${unsubscribeUrl}">Unsubscribe</a> from the Arsenal Daily Digest.
  </p>
</body>
</html>`;
}

/** Send email with retry and exponential backoff */
async function sendWithRetry(
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await sesClient.send(
        new SendEmailCommand({
          Source: SENDER_EMAIL,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: htmlBody } },
          },
        })
      );
      return true;
    } catch (error) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        JSON.stringify({
          level: "WARN",
          service: "digest",
          message: `Email send failed, retrying in ${delay}ms`,
          metadata: { attempt: attempt + 1, to, error: error instanceof Error ? error.message : String(error) },
        })
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

/** Main digest handler — triggered daily at 09:00 EST by EventBridge */
export async function handler(_event: DigestEvent): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  console.log(
    JSON.stringify({ level: "INFO", service: "digest", message: "Starting daily digest", metadata: { date: today } })
  );

  const items = await getTodaysContent(today);
  const subscribers = await getActiveSubscribers();
  const digest = compileDigest(items, today);
  const subject = `Arsenal Daily Digest — ${today}`;

  let sentCount = 0;
  let failCount = 0;

  for (const subscriber of subscribers) {
    const unsubscribeUrl = `${API_URL}/subscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribeToken}`;
    const html = renderDigestEmail(digest, unsubscribeUrl);
    const success = await sendWithRetry(subscriber.email, subject, html);

    if (success) {
      sentCount++;
    } else {
      failCount++;
      console.error(
        JSON.stringify({
          level: "ERROR",
          service: "digest",
          message: "Failed to send digest after retries",
          metadata: { email: "[redacted]" },
        })
      );
    }
  }

  console.log(
    JSON.stringify({
      level: "INFO",
      service: "digest",
      message: "Digest delivery complete",
      metadata: { sentCount, failCount, totalSubscribers: subscribers.length },
    })
  );
}
