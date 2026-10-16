/*
 * Waitlist logic: sign-up with double opt-in, confirmation and unsubscribe.
 *
 * Kept free of AWS SDK imports so it can be tested with fake dependencies.
 * handlers.mjs wires it to DynamoDB (store) and SES (mailer).
 *
 *   store:  get(email), put(item), findByToken(token), confirm(email, now, expiresAt), remove(email)
 *   mailer: send({ to, subject, text, html })
 */

import { randomBytes } from "node:crypto";
import { confirmationEmail } from "./emails.mjs";

const ROLES = ["organize", "join", "both"];
const FREQUENCIES = ["monthly", "few-months", "rarely"];
const LANGS = ["hu", "en"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTCODE_RE = /^[0-9]{4}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;

// Deletion via DynamoDB TTL on expiresAt (AWS removes expired items within a few days).
const PENDING_DAYS = 7; // unconfirmed sign-ups
const KEEP_DAYS = 365; // confirmed sign-ups, counted from confirmation: the "12 months" promise
const RESEND_AFTER_MS = 10 * 60 * 1000; // at most one confirmation email per address per 10 minutes

export function createApp({ store, mailer, siteUrl, now = () => Date.now() }) {
  const pageUrl = (lang) => (lang === "en" ? new URL("en/", siteUrl).href : siteUrl);

  async function signup(data, apiBaseUrl) {
    // Honeypot: real people never fill the hidden "website" field.
    if (data.website) return { status: 200, body: { ok: true } };

    const email = String(data.email || "").trim().toLowerCase();
    const postcode = String(data.postcode || "").trim();
    const role = String(data.role || "");
    const frequency = String(data.frequency || "");
    const lang = LANGS.includes(data.lang) ? data.lang : "hu";

    const valid =
      EMAIL_RE.test(email) &&
      email.length <= 254 &&
      POSTCODE_RE.test(postcode) &&
      ROLES.includes(role) &&
      (frequency === "" || FREQUENCIES.includes(frequency)) &&
      data.consent === "on";
    if (!valid) return { status: 400, body: { ok: false, error: "invalid" } };

    const t = now();
    const existing = await store.get(email);

    // Same answer in every case, so the form never reveals who is signed up.
    if (existing && existing.status === "confirmed") return { status: 200, body: { ok: true } };
    if (existing && t - existing.lastSentAt < RESEND_AFTER_MS) return { status: 200, body: { ok: true } };

    const token = existing ? existing.token : randomBytes(24).toString("base64url");
    const item = {
      email,
      postcode,
      role,
      lang,
      status: "pending",
      token,
      createdAt: existing ? existing.createdAt : t,
      consentAt: t,
      lastSentAt: t,
      expiresAt: Math.floor(t / 1000) + PENDING_DAYS * 86400
    };
    if (frequency) item.frequency = frequency;
    await store.put(item);

    const base = apiBaseUrl.replace(/\/$/, "");
    await mailer.send({
      to: email,
      ...confirmationEmail(lang, {
        confirmUrl: `${base}/confirm?token=${token}`,
        siteUrl: pageUrl(lang),
        pendingDays: PENDING_DAYS
      })
    });

    return { status: 200, body: { ok: true } };
  }

  async function confirm(token) {
    const item = TOKEN_RE.test(token || "") ? await store.findByToken(token) : null;
    const t = now();

    if (!item || (item.status === "pending" && item.expiresAt * 1000 < t)) {
      return { redirect: `${pageUrl(item ? item.lang : "hu")}?confirmed=0` };
    }
    if (item.status === "pending") {
      await store.confirm(item.email, t, Math.floor(t / 1000) + KEEP_DAYS * 86400);
    }
    return { redirect: `${pageUrl(item.lang)}?confirmed=1` };
  }

  async function unsubscribe(token) {
    const item = TOKEN_RE.test(token || "") ? await store.findByToken(token) : null;
    if (item) await store.remove(item.email);
    return { redirect: `${pageUrl(item ? item.lang : "hu")}?unsubscribed=1` };
  }

  return { signup, confirm, unsubscribe };
}
