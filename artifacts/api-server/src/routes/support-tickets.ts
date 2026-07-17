import { Router } from "express";
import { db } from "@workspace/db";
import { supportTicketsTable, supportTicketRepliesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { verifyToken } from "./auth";
import { sendMail, buildEmailHtml, getAdminNotificationEmail } from "../lib/mailer";
import { blockIfMustChangePassword } from "../lib/authHelpers";

const router = Router();
router.use(blockIfMustChangePassword);

function getUser(req: any): { userId: number } | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

// GET /support-tickets — the logged-in user's own tickets
router.get("/", async (req, res) => {
  const auth = getUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const tickets = await db
    .select()
    .from(supportTicketsTable)
    .where(eq(supportTicketsTable.userId, auth.userId))
    .orderBy(desc(supportTicketsTable.updatedAt));

  return res.json(tickets);
});

// POST /support-tickets — create a new ticket
router.post("/", async (req, res) => {
  const auth = getUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const { subject, message } = req.body ?? {};
  if (!subject || !message) {
    return res.status(400).json({ error: "subject and message are required" });
  }

  const [ticket] = await db
    .insert(supportTicketsTable)
    .values({ userId: auth.userId, subject, message })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId)).limit(1);
  const adminEmail = await getAdminNotificationEmail();
  if (adminEmail) {
    sendMail({
      to: adminEmail,
      subject: `New Support Ticket: ${subject}`,
      text: `${user?.name ?? "A user"} (${user?.email ?? "unknown"}) opened a new support ticket.\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: buildEmailHtml({
        title: `New Support Ticket: ${subject}`,
        preheader: `${user?.name ?? "A user"} opened a new support ticket.`,
        body: `
          <p>A new support ticket has been submitted.</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:8px;padding:16px 20px;width:100%;">
            <tr><td style="font-size:13px;color:#475569;padding:5px 0;"><strong>From:</strong>&nbsp;&nbsp;${user?.name ?? "Unknown"} (${user?.email ?? "unknown"})</td></tr>
            <tr><td style="font-size:13px;color:#475569;padding:5px 0;"><strong>Subject:</strong>&nbsp;&nbsp;${subject}</td></tr>
          </table>
          <p style="font-size:14px;color:#334155;white-space:pre-wrap;">${message}</p>
          <p>— Streetly Support System</p>
        `,
        cta: { label: "View in Admin Panel", href: "https://mystreetly.app/admin" },
      }),
    }).catch(() => {});
  }

  return res.status(201).json(ticket);
});

// GET /support-tickets/:id — ticket detail with replies (owner or admin)
router.get("/:id", async (req, res) => {
  const auth = getUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const ticketId = parseInt(req.params.id ?? "0");
  const [ticket] = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.id, ticketId)).limit(1);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId)).limit(1);
  const isStaff = requester?.role === "admin" || requester?.role === "moderator";
  if (ticket.userId !== auth.userId && !isStaff) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const replies = await db
    .select({
      id: supportTicketRepliesTable.id,
      ticketId: supportTicketRepliesTable.ticketId,
      senderId: supportTicketRepliesTable.senderId,
      senderRole: supportTicketRepliesTable.senderRole,
      message: supportTicketRepliesTable.message,
      createdAt: supportTicketRepliesTable.createdAt,
      senderName: usersTable.name,
    })
    .from(supportTicketRepliesTable)
    .leftJoin(usersTable, eq(supportTicketRepliesTable.senderId, usersTable.id))
    .where(eq(supportTicketRepliesTable.ticketId, ticketId))
    .orderBy(supportTicketRepliesTable.createdAt);

  return res.json({ ticket, replies });
});

// POST /support-tickets/:id/replies — reply on a ticket (owner or admin)
router.post("/:id/replies", async (req, res) => {
  const auth = getUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const ticketId = parseInt(req.params.id ?? "0");
  const { message } = req.body ?? {};
  if (!message) return res.status(400).json({ error: "message is required" });

  const [ticket] = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.id, ticketId)).limit(1);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId)).limit(1);
  const isStaff = sender?.role === "admin" || sender?.role === "moderator";
  if (ticket.userId !== auth.userId && !isStaff) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const [reply] = await db
    .insert(supportTicketRepliesTable)
    .values({ ticketId, senderId: auth.userId, senderRole: isStaff ? "admin" : "user", message })
    .returning();

  await db
    .update(supportTicketsTable)
    .set({ updatedAt: new Date(), status: isStaff ? "in_progress" : ticket.status })
    .where(eq(supportTicketsTable.id, ticketId));

  if (isStaff) {
    const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, ticket.userId)).limit(1);
    if (owner?.email) {
      sendMail({
        to: owner.email,
        subject: `Re: ${ticket.subject}`,
        text: `Our support team replied to your ticket "${ticket.subject}":\n\n${message}`,
        html: buildEmailHtml({
          title: `Reply to your support ticket`,
          preheader: `The Streetly support team replied to your ticket.`,
          body: `
            <p>Hi <strong>${owner.name}</strong>,</p>
            <p>Our support team has replied to your ticket: <strong>${ticket.subject}</strong></p>
            <div style="margin:20px 0;padding:16px 20px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;font-size:14px;color:#166534;white-space:pre-wrap;">${message}</div>
            <p style="color:#64748b;font-size:14px;">You can reply directly in the app or open the ticket to continue the conversation.</p>
            <p>— The Streetly Support Team</p>
          `,
          cta: { label: "View My Ticket", href: "https://mystreetly.app" },
        }),
      }).catch(() => {});
    }
  } else {
    const adminEmail = await getAdminNotificationEmail();
    if (adminEmail) {
      sendMail({
        to: adminEmail,
        subject: `New reply on ticket: ${ticket.subject}`,
        text: `${sender?.name ?? "A user"} replied on ticket "${ticket.subject}":\n\n${message}`,
        html: buildEmailHtml({
          title: `New reply on support ticket`,
          preheader: `${sender?.name ?? "A user"} replied on a support ticket.`,
          body: `
            <p><strong>${sender?.name ?? "A user"}</strong> replied on ticket: <strong>${ticket.subject}</strong></p>
            <div style="margin:20px 0;padding:16px 20px;background:#f8fafc;border-left:4px solid #4a9eff;border-radius:6px;font-size:14px;color:#334155;white-space:pre-wrap;">${message}</div>
            <p>— Streetly Support System</p>
          `,
          cta: { label: "View in Admin Panel", href: "https://mystreetly.app/admin" },
        }),
      }).catch(() => {});
    }
  }

  return res.status(201).json(reply);
});

// PUT /support-tickets/:id/status — update ticket status (admin only)
router.put("/:id/status", async (req, res) => {
  const auth = getUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, auth.userId)).limit(1);
  if (sender?.role !== "admin" && sender?.role !== "moderator") return res.status(403).json({ error: "Forbidden" });

  const ticketId = parseInt(req.params.id ?? "0");
  const { status } = req.body ?? {};
  if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const [ticket] = await db
    .update(supportTicketsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(supportTicketsTable.id, ticketId))
    .returning();

  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  return res.json(ticket);
});

export default router;
