/*
 * Confirmation email (double opt-in), Hungarian and English.
 * Plain text plus a simple inline-styled HTML version that renders in all mail clients.
 */

const COPY = {
  hu: {
    subject: "Erősítsd meg a feliratkozásod – Kosárbarát",
    greeting: "Szia!",
    intro: "Köszönjük, hogy feliratkoztál a Kosárbarát várólistájára. Kattints az alábbi gombra, hogy a feliratkozásod érvényes legyen.",
    button: "Megerősítem a feliratkozást",
    fallback: "Ha a gomb nem működik, másold be ezt a linket a böngésződbe:",
    ignore: (days) => `Ha nem te iratkoztál fel, nincs teendőd: ${days} napon belül automatikusan töröljük az adataidat.`,
    footer: "Kosárbarát – független szolgáltatás, nem áll kapcsolatban a Temuval."
  },
  en: {
    subject: "Confirm your sign-up – Kosárbarát",
    greeting: "Hi there,",
    intro: "Thanks for joining the Kosárbarát waitlist. Click the button below so your sign-up counts.",
    button: "Confirm my sign-up",
    fallback: "If the button doesn't work, copy this link into your browser:",
    ignore: (days) => `If you didn't sign up, you don't need to do anything: your details are deleted automatically within ${days} days.`,
    footer: "Kosárbarát – an independent service, not affiliated with Temu."
  }
};

export function confirmationEmail(lang, { confirmUrl, siteUrl, pendingDays }) {
  const c = COPY[lang] || COPY.hu;

  const text = [
    c.greeting,
    "",
    c.intro,
    "",
    confirmUrl,
    "",
    c.ignore(pendingDays),
    "",
    "--",
    c.footer,
    siteUrl
  ].join("\n");

  const html = `<!doctype html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f7f5ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5ef;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;font-family:Arial,Helvetica,sans-serif;color:#10231c;">
        <tr><td style="padding:28px 28px 0;font-size:20px;font-weight:bold;color:#1f7a57;">Kosárbarát</td></tr>
        <tr><td style="padding:20px 28px 0;font-size:16px;line-height:1.6;">
          <p style="margin:0 0 12px;">${c.greeting}</p>
          <p style="margin:0;">${c.intro}</p>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#1f7a57;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">${c.button}</a>
        </td></tr>
        <tr><td style="padding:0 28px 28px;font-size:13px;line-height:1.6;color:#66786f;">
          <p style="margin:0 0 6px;">${c.fallback}</p>
          <p style="margin:0 0 16px;word-break:break-all;"><a href="${confirmUrl}" style="color:#145c41;">${confirmUrl}</a></p>
          <p style="margin:0;">${c.ignore(pendingDays)}</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#66786f;">${c.footer}<br><a href="${siteUrl}" style="color:#66786f;">${siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: c.subject, text, html };
}
