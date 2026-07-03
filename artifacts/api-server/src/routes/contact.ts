import { Router } from "express";
import { db } from "@workspace/db";
import { contactSubmissionsTable } from "@workspace/db";
import { sendMail, getAdminNotificationEmail } from "../lib/mailer";

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
    }).catch(() => {});
  }

  return res.status(201).json(submission);
});

export default router;
