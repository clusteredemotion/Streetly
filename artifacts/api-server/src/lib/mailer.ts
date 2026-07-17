import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.execute(sql`SELECT key, value FROM settings ORDER BY key`);
  const settings: Record<string, string> = {};
  for (const row of rows.rows as { key: string; value: string | null }[]) {
    settings[row.key] = row.value ?? "";
  }
  return settings;
}

/* ─── Shared branded HTML template ─────────────────────────────── */

const GREEN       = "#16a34a";
const DARK_GREEN  = "#15803d";
const YELLOW      = "#facc15";
const LOGO_URL    = "https://mystreetly.app/favicon-256.png";
const APP_URL     = "https://mystreetly.app";

export function buildEmailHtml(opts: {
  title:      string;
  preheader?: string;
  body:       string;
  cta?:       { label: string; href: string };
}): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Arial,sans-serif;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f0f4f8;">${opts.preheader}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <tr>
        <td style="background:${GREEN};padding:28px 40px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <img src="${LOGO_URL}" alt="Streetly" width="44" height="44"
                  style="border-radius:10px;vertical-align:middle;margin-right:10px;display:inline-block;"/>
                <span style="font-size:26px;font-weight:900;color:#ffffff;vertical-align:middle;letter-spacing:-0.5px;display:inline-block;">
                  Street<span style="color:${YELLOW};">ly</span>
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.75;">
          ${opts.body}
          ${opts.cta ? `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
            <tr>
              <td align="left">
                <a href="${opts.cta.href}"
                  style="display:inline-block;background:${GREEN};color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:13px 30px;border-radius:10px;letter-spacing:0.3px;">${opts.cta.label}</a>
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#94a3b8;margin-top:14px;line-height:1.5;">
            Or copy this link:<br/>
            <a href="${opts.cta.href}" style="color:${GREEN};word-break:break-all;">${opts.cta.href}</a>
          </p>` : ""}
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr><td style="height:1px;background:#e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8fafc;padding:22px 40px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <img src="${LOGO_URL}" alt="Streetly" width="24" height="24"
                  style="border-radius:5px;vertical-align:middle;margin-right:6px;display:inline-block;opacity:0.6;"/>
                <span style="font-size:12px;color:#94a3b8;vertical-align:middle;">
                  &copy; ${year} Streetly Nigeria &nbsp;|&nbsp;
                  <a href="${APP_URL}" style="color:#64748b;text-decoration:none;">mystreetly.app</a>
                </span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:6px;">
                <span style="font-size:11px;color:#cbd5e1;">Discovering every business, every street</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ─── Core sendMail ─────────────────────────────────────────────── */

export async function sendMail(opts: {
  to:       string;
  subject:  string;
  text:     string;
  html?:    string;
}): Promise<boolean> {
  const settings  = await getSettings();
  const host      = settings.smtp_host;
  const port      = Number(settings.smtp_port || "587");
  const user      = settings.smtp_user;
  const pass      = settings.smtp_password;
  const fromEmail = settings.smtp_from_email || user;
  const fromName  = settings.smtp_from_name || "Streetly";
  const encryption = settings.smtp_encryption || "tls";

  if (!host || !user || !pass || !fromEmail) {
    logger.warn("Mailer: SMTP not configured — go to Admin → Email & Account → SMTP to configure");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: encryption === "ssl",
      auth: { user, pass },
      ...(encryption === "none" ? { ignoreTLS: true } : {}),
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to:      opts.to,
      subject: opts.subject,
      text:    opts.text,
      html:    opts.html ?? opts.text,
    });
    logger.info({ to: opts.to, subject: opts.subject }, "Mailer: email sent");
    return true;
  } catch (err) {
    logger.error({ err }, "Mailer: failed to send email");
    return false;
  }
}

/* ─── Test email ────────────────────────────────────────────────── */

export async function sendTestMail(to: string): Promise<{ ok: boolean; error?: string }> {
  const html = buildEmailHtml({
    title:     "Streetly — Test Email",
    preheader: "Your Streetly email configuration is working correctly.",
    body: `
      <p>Hi there,</p>
      <p>This is a <strong>test email</strong> from your Streetly platform. If you're reading this, your SMTP configuration is working correctly!</p>
      <p style="margin-top:20px;padding:16px 20px;background:#f0fdf4;border-left:4px solid ${GREEN};border-radius:6px;font-size:14px;color:#166534;">
        ✅ Your outgoing mail server is connected and sending emails successfully.
      </p>
      <p style="color:#64748b;font-size:14px;">You can now close this and start using all automated emails across the platform.</p>
      <p>— The Streetly Team</p>
    `,
  });

  const ok = await sendMail({
    to,
    subject: "✅ Streetly — Test Email (SMTP Working)",
    text:    "Your Streetly SMTP configuration is working correctly. This is a test email.",
    html,
  });

  if (ok) return { ok: true };
  return { ok: false, error: "SMTP not configured or send failed — check your credentials." };
}

/* ─── Helpers ───────────────────────────────────────────────────── */

export async function getAdminNotificationEmail(): Promise<string | null> {
  const settings = await getSettings();
  return settings.admin_login_email || settings.smtp_from_email || null;
}
