/*
 * Lambda entry points for the waitlist HTTP API (payload format 2.0).
 * Connects app.mjs to DynamoDB (sign-ups) and SES (confirmation emails).
 * The AWS SDK v3 ships with the Node.js Lambda runtime, so there is nothing to install.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { createApp } from "./app.mjs";

const TABLE = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESv2Client({});

const store = {
  async get(email) {
    const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { email } }));
    return res.Item || null;
  },
  async put(item) {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  },
  async findByToken(token) {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: "token-index",
      KeyConditionExpression: "#t = :t",
      ExpressionAttributeNames: { "#t": "token" },
      ExpressionAttributeValues: { ":t": token },
      Limit: 1
    }));
    return (res.Items && res.Items[0]) || null;
  },
  async confirm(email, now, expiresAt) {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { email },
      UpdateExpression: "SET #s = :c, confirmedAt = :now, expiresAt = :exp",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":c": "confirmed", ":now": now, ":exp": expiresAt }
    }));
  },
  async remove(email) {
    await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { email } }));
  }
};

// A non-ASCII display name ("Kosárbarát") must be MIME-encoded in the From header.
const fromName = `=?UTF-8?B?${Buffer.from(process.env.FROM_NAME || "", "utf8").toString("base64")}?=`;
const from = `${fromName} <${process.env.FROM_EMAIL}>`;

const mailer = {
  async send({ to, subject, text, html }) {
    await ses.send(new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: text, Charset: "UTF-8" },
            Html: { Data: html, Charset: "UTF-8" }
          }
        }
      }
    }));
  }
};

const app = createApp({ store, mailer, siteUrl: process.env.SITE_URL });

function json(status, body) {
  return { statusCode: status, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

function redirect(location) {
  return { statusCode: 302, headers: { location, "cache-control": "no-store" } };
}

export async function signup(event) {
  let data;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body;
    data = JSON.parse(raw || "{}");
  } catch {
    return json(400, { ok: false, error: "invalid" });
  }

  // Links in the email point back at this API: https://<domain>/api through CloudFront (set by Terraform).
  const apiBaseUrl = process.env.PUBLIC_API_URL || `https://${event.requestContext.domainName}/api`;

  try {
    const res = await app.signup(data, apiBaseUrl);
    return json(res.status, res.body);
  } catch (err) {
    console.error("Sign-up failed", err);
    return json(500, { ok: false, error: "failed" });
  }
}

export async function confirm(event) {
  const res = await app.confirm((event.queryStringParameters || {}).token);
  return redirect(res.redirect);
}

export async function unsubscribe(event) {
  const res = await app.unsubscribe((event.queryStringParameters || {}).token);
  return redirect(res.redirect);
}
