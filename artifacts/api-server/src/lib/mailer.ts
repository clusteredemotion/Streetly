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

export async function sendMail(opts: { to: string; subject: string; text: string; html?: string }): Promise<boolean> {
  const settings = await getSettings();
  const host = settings.smtp_host;
  const port = Number(settings.smtp_port || "587");
  const user = settings.smtp_user;
  const pass = settings.smtp_password;
  const fromEmail = settings.smtp_from_email || user;
  const fromName = settings.smtp_from_name || "Streetly";
  const encryption = settings.smtp_encryption || "tls";

  if (!host || !user || !pass || !fromEmail) {
    logger.warn("Mailer: SMTP not configured, skipping email send");
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
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? opts.text,
    });
    return true;
  } catch (err) {
    logger.error({ err }, "Mailer: failed to send email");
    return false;
  }
}

export async function getAdminNotificationEmail(): Promise<string | null> {
  const settings = await getSettings();
  return settings.admin_login_email || settings.smtp_from_email || null;
}
