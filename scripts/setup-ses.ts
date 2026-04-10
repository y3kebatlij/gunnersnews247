/**
 * SES setup script for Arsenal News Aggregator.
 * Run with: npx ts-node scripts/setup-ses.ts
 *
 * This script:
 * 1. Verifies the sender email identity in SES
 * 2. Creates an email template for the daily digest
 * 3. Checks current SES sending quota (sandbox vs production)
 *
 * In SES sandbox mode, both sender AND recipient emails must be verified.
 * To send to unverified recipients, request production access via AWS console.
 */

import {
  SESClient,
  VerifyEmailIdentityCommand,
  GetIdentityVerificationAttributesCommand,
  GetSendQuotaCommand,
  CreateTemplateCommand,
  GetTemplateCommand,
} from "@aws-sdk/client-ses";

const sesClient = new SESClient({});
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL ?? "noreply@example.com";

async function checkVerificationStatus(email: string): Promise<string> {
  const result = await sesClient.send(
    new GetIdentityVerificationAttributesCommand({
      Identities: [email],
    })
  );
  return result.VerificationAttributes?.[email]?.VerificationStatus ?? "NotStarted";
}

async function verifySenderEmail(): Promise<void> {
  console.log(`\n=== Sender Email Verification ===`);
  console.log(`Sender email: ${SENDER_EMAIL}`);

  const status = await checkVerificationStatus(SENDER_EMAIL);
  console.log(`Current status: ${status}`);

  if (status === "Success") {
    console.log("✓ Email already verified.");
    return;
  }

  console.log("Sending verification email...");
  await sesClient.send(
    new VerifyEmailIdentityCommand({ EmailAddress: SENDER_EMAIL })
  );
  console.log(`✓ Verification email sent to ${SENDER_EMAIL}.`);
  console.log("  Check your inbox and click the verification link.");
}

async function checkSendingQuota(): Promise<void> {
  console.log(`\n=== SES Sending Quota ===`);
  const quota = await sesClient.send(new GetSendQuotaCommand({}));

  console.log(`Max 24-hour send: ${quota.Max24HourSend}`);
  console.log(`Max send rate: ${quota.MaxSendRate} emails/sec`);
  console.log(`Sent last 24h: ${quota.SentLast24Hours}`);

  if ((quota.Max24HourSend ?? 0) <= 200) {
    console.log("\n⚠ You are in SES SANDBOX mode.");
    console.log("  In sandbox mode:");
    console.log("  - You can only send to verified email addresses");
    console.log("  - Max 200 emails per 24 hours");
    console.log("  - Max 1 email per second");
    console.log("\n  To send to unverified subscribers, request production access:");
    console.log("  AWS Console → SES → Account dashboard → Request production access");
  } else {
    console.log("✓ You are in SES PRODUCTION mode.");
  }
}

async function createDigestTemplate(): Promise<void> {
  console.log(`\n=== Email Template ===`);

  const templateName = "ArsenalDailyDigest";

  try {
    await sesClient.send(new GetTemplateCommand({ TemplateName: templateName }));
    console.log(`✓ Template "${templateName}" already exists.`);
    return;
  } catch {
    // Template doesn't exist, create it
  }

  await sesClient.send(
    new CreateTemplateCommand({
      Template: {
        TemplateName: templateName,
        SubjectPart: "Arsenal Daily Digest — {{date}}",
        HtmlPart: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Arsenal Daily Digest</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fff;">
  <div style="background:#EF0107;color:#fff;padding:16px;text-align:center;">
    <h1 style="margin:0;font-size:24px;">Arsenal Daily Digest</h1>
    <p style="margin:4px 0 0;font-size:14px;">{{date}} — {{itemCount}} stories</p>
  </div>
  <div style="padding:16px;">
    {{content}}
  </div>
  <hr style="margin-top:24px;border:none;border-top:1px solid #ddd;"/>
  <p style="font-size:12px;color:#71767a;text-align:center;">
    You're receiving this because you subscribed to the Arsenal Daily Digest.<br/>
    <a href="{{unsubscribeUrl}}" style="color:#1a4480;">Unsubscribe</a>
  </p>
</body>
</html>`,
        TextPart: `Arsenal Daily Digest — {{date}}

{{textContent}}

---
Unsubscribe: {{unsubscribeUrl}}`,
      },
    })
  );

  console.log(`✓ Template "${templateName}" created.`);
}

async function printNextSteps(): Promise<void> {
  console.log(`\n=== Next Steps ===`);
  console.log(`1. Check your email (${SENDER_EMAIL}) for the verification link`);
  console.log(`2. Click the link to verify your sender identity`);
  console.log(`3. If in sandbox mode, also verify any test recipient emails:`);
  console.log(`   npx ts-node -e "import {SESClient,VerifyEmailIdentityCommand} from '@aws-sdk/client-ses'; new SESClient({}).send(new VerifyEmailIdentityCommand({EmailAddress:'test@example.com'}))"`);
  console.log(`4. For production use, request SES production access via AWS Console`);
  console.log(`5. Set SES_SENDER_EMAIL in your .env file and CDK environment`);
}

async function main(): Promise<void> {
  console.log("Arsenal News Aggregator — SES Setup");
  console.log("====================================");

  try {
    await verifySenderEmail();
    await checkSendingQuota();
    await createDigestTemplate();
    await printNextSteps();
  } catch (error) {
    console.error("\nSES setup failed:", error instanceof Error ? error.message : error);
    console.error("\nMake sure:");
    console.error("  - AWS credentials are configured (env vars or ~/.aws/credentials)");
    console.error("  - SES_SENDER_EMAIL is set to a real email you control");
    console.error("  - Your AWS region supports SES");
    process.exit(1);
  }
}

main();
