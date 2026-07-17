import { Router } from "express";
import { db } from "@workspace/db";
import { contactSubmissionsTable } from "@workspace/db";
import { sendMail, buildEmailHtml, getAdminNotificationEmail } from "../lib/mailer";

const router = Router();

// POST /contact
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body ?? {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "name, email, subject, and message are required" });
  }

  const [submission] = await db
    .insert(contactSubmissionsTable)
    .values({ name, email, subject, message })
    .returning();

  const adminEmail = await getAdminNotificationEmail();
  if (adminEmail) {
    sendMail({
      to: adminEmail,
      subject: `New Contact Form Submission: ${subject}`,
      text: `${name} (${email}) sent a message via the Contact Us form.\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: buildEmailHtml({
        title: `New Contact Form Submission`,
        preheader: `${name} sent a message via the Streetly contact form.`,
        body: `
          <p>A new message was submitted via the Contact Us form.</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:8px;padding:16px 20px;width:100%;">
            <tr><td style="font-size:13px;color:#475569;padding:5px 0;"><strong>Name:</strong>&nbsp;&nbsp;${name}</td></tr>
            <tr><td style="font-size:13px;color:#475569;padding:5px 0;"><strong>Email:</strong>&nbsp;&nbsp;<a href="mailto:${email}" style="color:#16a34a;">${email}</a></td></tr>
            <tr><td style="font-size:13px;color:#475569;padding:5px 0;"><strong>Subject:</strong>&nbsp;&nbsp;${subject}</td></tr>
          </table>
          <p style="font-size:14px;color:#334155;white-space:pre-wrap;">${message}</p>
          <p>— Streetly Contact System</p>
        `,
        cta: { label: `Reply to ${name}`, href: `mailto:${email}` },
      }),
    }).catch(() => {});
  }

  return res.status(201).json(submission);
});

export default router;
