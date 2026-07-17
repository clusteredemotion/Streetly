import { Router, Request } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  conversationsTable, chatMessagesTable, businessesTable, usersTable,
} from "@workspace/db";
import { eq, and, or, desc, isNull, isNotNull, ne, sql, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/authHelpers";
import { notifyAdmins } from "../lib/notifyAdmins";
import { notifyUser } from "../lib/notifyUser";

type IdParams = { id: string };

const router = Router();

// ─── In-memory typing store ───────────────────────────────────────────────────
// Key: `${conversationId}:${role}` — e.g. "42:admin", "42:customer", "42:guest"
// No DB needed; state lives only in the running process.
const typingStore = new Map<string, { typedAt: number; label: string }>();
const TYPING_TTL_MS = 4000; // consider "stopped typing" after 4 s

function setTyping(convId: number, role: string, label: string) {
  typingStore.set(`${convId}:${role}`, { typedAt: Date.now(), label });
}

function getOtherTyping(
  convId: number,
  excludeRole: string
): { isTyping: boolean; label: string | null } {
  const prefix = `${convId}:`;
  const now = Date.now();
  for (const [key, val] of typingStore) {
    if (!key.startsWith(prefix)) continue;
    const role = key.slice(prefix.length);
    if (role === excludeRole) continue;
    if (now - val.typedAt > TYPING_TTL_MS) {
      typingStore.delete(key);
      continue;
    }
    return { isTyping: true, label: val.label };
  }
  return { isTyping: false, label: null };
}

// ─── Enrichment helper ────────────────────────────────────────────────────────

async function enrichConversation(conv: typeof conversationsTable.$inferSelect) {
  const customer = conv.customerId != null
    ? (await db.select().from(usersTable).where(eq(usersTable.id, conv.customerId)).limit(1))[0] ?? null
    : null;
  const [business] = conv.businessId
    ? await db.select().from(businessesTable).where(eq(businessesTable.id, conv.businessId)).limit(1)
    : [];
  const [rider] = conv.riderId
    ? await db.select().from(usersTable).where(eq(usersTable.id, conv.riderId)).limit(1)
    : [];
  const [lastMsg] = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, conv.id))
    .orderBy(desc(chatMessagesTable.createdAt)).limit(1);

  const [unread] = await db.select({ count: sql<number>`count(*)` }).from(chatMessagesTable)
    .where(and(eq(chatMessagesTable.conversationId, conv.id), isNull(chatMessagesTable.readAt)));

  return {
    ...conv,
    customerName: conv.guestName ?? customer?.name ?? null,
    customerEmail: customer?.email ?? null,
    isGuest: conv.customerId == null,
    businessName: business?.name ?? null,
    riderName: rider?.name ?? null,
    unreadCount: Number(unread?.count ?? 0),
    lastMessage: lastMsg ? { body: lastMsg.body, senderId: lastMsg.senderId, senderRole: lastMsg.senderRole, createdAt: lastMsg.createdAt } : null,
  };
}

// ─── Guest (unauthenticated) routes ─────────────────────────────────────────

// POST /conversations/guest — start a guest conversation
router.post("/guest", async (req, res) => {
  const { businessId, guestName, guestPhone } = req.body;
  if (!businessId) return res.status(400).json({ error: "businessId is required" });
  if (!String(guestName ?? "").trim()) return res.status(400).json({ error: "Full name is required" });
  if (!String(guestPhone ?? "").trim()) return res.status(400).json({ error: "Phone number is required" });

  const guestToken = crypto.randomBytes(32).toString("hex");

  const [conv] = await db.insert(conversationsTable).values({
    customerId: null,
    businessId: Number(businessId),
    guestName: String(guestName).trim().slice(0, 100),
    guestPhone: String(guestPhone).trim().slice(0, 30),
    guestToken,
    status: "connecting",
    assignedTo: "admin",
  }).returning();

  notifyAdmins(
    "New Guest Chat",
    `${String(guestName).trim()} started a chat (guest)`,
    { type: "chat", conversationId: String(conv.id) }
  ).catch(() => {});

  return res.status(201).json({ conversationId: conv.id, guestToken });
});

// GET /conversations/guest/:token — fetch meta + messages for a guest session
router.get("/guest/:token", async (req, res) => {
  const { token } = req.params;
  const [conv] = await db.select().from(conversationsTable)
    .where(eq(conversationsTable.guestToken, token)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const [business] = conv.businessId
    ? await db.select().from(businessesTable).where(eq(businessesTable.id, conv.businessId)).limit(1)
    : [];

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, conv.id))
    .orderBy(chatMessagesTable.createdAt);

  // Mark admin/business messages as read for guest
  await db.update(chatMessagesTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(chatMessagesTable.conversationId, conv.id),
      isNull(chatMessagesTable.readAt),
      isNotNull(chatMessagesTable.senderId),
    ));

  return res.json({
    conversation: {
      id: conv.id,
      status: conv.status,
      assignedTo: conv.assignedTo,
      businessName: business?.name ?? null,
      guestName: conv.guestName,
    },
    messages,
  });
});

// POST /conversations/guest/:token/messages — guest sends a message
router.post("/guest/:token/messages", async (req, res) => {
  const { token } = req.params;
  const { body } = req.body;
  if (!body || !String(body).trim()) return res.status(400).json({ error: "Message body is required" });

  const [conv] = await db.select().from(conversationsTable)
    .where(eq(conversationsTable.guestToken, token)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const [msg] = await db.insert(chatMessagesTable).values({
    conversationId: conv.id,
    senderId: null,
    senderRole: "customer",
    body: String(body).trim().slice(0, 2000),
  }).returning();

  await db.update(conversationsTable)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversationsTable.id, conv.id));

  notifyAdmins(
    "New Guest Message",
    `${conv.guestName ?? "Guest"} sent a message in conversation #${conv.id}`,
    { type: "chat", conversationId: String(conv.id) }
  ).catch(() => {});

  return res.status(201).json(msg);
});

// POST /conversations/guest/:token/typing — guest signals they are typing
router.post("/guest/:token/typing", async (req, res) => {
  const { token } = req.params;
  const [conv] = await db.select({ id: conversationsTable.id, guestName: conversationsTable.guestName })
    .from(conversationsTable).where(eq(conversationsTable.guestToken, token)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  setTyping(conv.id, "guest", conv.guestName ?? "Guest");
  return res.json({ ok: true });
});

// GET /conversations/guest/:token/typing-status — is admin/business typing?
router.get("/guest/:token/typing-status", async (req, res) => {
  const { token } = req.params;
  const [conv] = await db.select({ id: conversationsTable.id })
    .from(conversationsTable).where(eq(conversationsTable.guestToken, token)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  return res.json(getOtherTyping(conv.id, "guest"));
});

// ─── Authenticated routes ────────────────────────────────────────────────────

// POST /conversations — start (or reuse) a conversation
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const { businessId, riderId, deliveryId, subject } = req.body;

  if (!businessId && !riderId) {
    return res.status(400).json({ error: "businessId or riderId is required" });
  }

  const conditions = [eq(conversationsTable.customerId, user.id)];
  if (businessId) conditions.push(eq(conversationsTable.businessId, Number(businessId)));
  if (riderId) conditions.push(eq(conversationsTable.riderId, Number(riderId)));

  const [existing] = await db.select().from(conversationsTable).where(and(...conditions)).limit(1);
  if (existing) {
    const enriched = await enrichConversation(existing);
    return res.json(enriched);
  }

  const [conv] = await db.insert(conversationsTable).values({
    customerId: user.id,
    businessId: businessId ? Number(businessId) : null,
    riderId: riderId ? Number(riderId) : null,
    deliveryId: deliveryId ? Number(deliveryId) : null,
    subject: subject || null,
    status: "connecting",
    assignedTo: "admin",
  }).returning();

  const enriched = await enrichConversation(conv);
  return res.status(201).json(enriched);
});

// GET /conversations/unread-count — cheap total unread count for the current user
router.get("/unread-count", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;

  let convIds: number[] = [];

  if (user.role === "admin") {
    const rows = await db.select({ id: conversationsTable.id }).from(conversationsTable);
    convIds = rows.map(r => r.id);
  } else {
    const myBusinesses = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.ownerId, user.id));
    const myBusinessIds = myBusinesses.map(b => b.id);

    const conditions = [
      eq(conversationsTable.customerId, user.id),
      eq(conversationsTable.riderId, user.id),
    ];
    const rows =
      myBusinessIds.length > 0
        ? await db
            .select({ id: conversationsTable.id })
            .from(conversationsTable)
            .where(or(...conditions, ...myBusinessIds.map(id => eq(conversationsTable.businessId, id))))
        : await db
            .select({ id: conversationsTable.id })
            .from(conversationsTable)
            .where(or(...conditions));
    convIds = rows.map(r => r.id);
  }

  if (convIds.length === 0) {
    return res.json({ count: 0 });
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatMessagesTable)
    .where(
      and(
        inArray(chatMessagesTable.conversationId, convIds),
        isNull(chatMessagesTable.readAt),
        or(isNull(chatMessagesTable.senderId), ne(chatMessagesTable.senderId, user.id))
      )
    );

  return res.json({ count: Number(result?.count ?? 0) });
});

// GET /conversations — list conversations where I'm the customer, the business owner, or the rider
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;

  // Admin sees all
  if (user.role === "admin") {
    const rows = await db.select().from(conversationsTable).orderBy(desc(conversationsTable.lastMessageAt));
    const enriched = await Promise.all(rows.map(enrichConversation));
    return res.json(enriched);
  }

  const myBusinesses = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.ownerId, user.id));
  const myBusinessIds = myBusinesses.map(b => b.id);

  const conditions = [eq(conversationsTable.customerId, user.id), eq(conversationsTable.riderId, user.id)];
  let rows: (typeof conversationsTable.$inferSelect)[] = [];
  if (myBusinessIds.length > 0) {
    rows = await db.select().from(conversationsTable)
      .where(or(...conditions, ...myBusinessIds.map(id => eq(conversationsTable.businessId, id))))
      .orderBy(desc(conversationsTable.lastMessageAt));
  } else {
    rows = await db.select().from(conversationsTable)
      .where(or(...conditions))
      .orderBy(desc(conversationsTable.lastMessageAt));
  }

  const enriched = await Promise.all(rows.map(enrichConversation));
  return res.json(enriched);
});

function canAccessConversation(conv: typeof conversationsTable.$inferSelect, userId: number, isBusinessOwner: boolean, isAdmin: boolean) {
  return isAdmin || conv.customerId === userId || conv.riderId === userId || isBusinessOwner;
}

// GET /conversations/:id/messages
router.get("/:id/messages", requireAuth, async (req: Request<IdParams>, res) => {
  const user = (req as any).currentUser;
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  let isBusinessOwner = false;
  if (conv.businessId) {
    const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, conv.businessId)).limit(1);
    isBusinessOwner = biz?.ownerId === user.id;
  }
  const isAdmin = user.role === "admin";
  if (!canAccessConversation(conv, user.id, isBusinessOwner, isAdmin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id))
    .orderBy(chatMessagesTable.createdAt);

  await db.update(chatMessagesTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(chatMessagesTable.conversationId, id),
      isNull(chatMessagesTable.readAt),
      or(isNull(chatMessagesTable.senderId), ne(chatMessagesTable.senderId, user.id))
    ));

  return res.json(messages);
});

// POST /conversations/:id/messages
router.post("/:id/messages", requireAuth, async (req: Request<IdParams>, res) => {
  const user = (req as any).currentUser;
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { body } = req.body;
  if (!body || !String(body).trim()) return res.status(400).json({ error: "Message body is required" });

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  let isBusinessOwner = false;
  if (conv.businessId) {
    const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, conv.businessId)).limit(1);
    isBusinessOwner = biz?.ownerId === user.id;
  }
  const isAdmin = user.role === "admin";
  if (!canAccessConversation(conv, user.id, isBusinessOwner, isAdmin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  let senderRole: string;
  if (isAdmin) {
    senderRole = "admin";
    if (conv.status === "connecting") {
      await db.update(conversationsTable)
        .set({ status: "active", assignedTo: "admin" })
        .where(eq(conversationsTable.id, id));
    }
  } else if (isBusinessOwner) {
    senderRole = "business";
  } else if (conv.riderId === user.id) {
    senderRole = "rider";
  } else {
    senderRole = "customer";
  }

  const [msg] = await db.insert(chatMessagesTable).values({
    conversationId: id,
    senderId: user.id,
    senderRole,
    body: String(body).trim().slice(0, 2000),
  }).returning();

  await db.update(conversationsTable).set({ lastMessageAt: new Date() }).where(eq(conversationsTable.id, id));

  if (!isAdmin) {
    notifyAdmins(
      "New Chat Message",
      `${senderRole.charAt(0).toUpperCase() + senderRole.slice(1)} sent a message in conversation #${id}`,
      { type: "chat", conversationId: String(id) }
    ).catch(() => {});
  } else if (conv.customerId != null) {
    // Admin replied — push notification to the customer's device
    notifyUser(
      conv.customerId,
      "New message from Streetly",
      String(body).trim().slice(0, 120),
      { type: "chat", conversationId: String(id) }
    ).catch(() => {});
  }

  return res.status(201).json(msg);
});

// POST /conversations/:id/typing — signal that the current user is typing
router.post("/:id/typing", requireAuth, async (req: Request<IdParams>, res) => {
  const user = (req as any).currentUser;
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  let isBusinessOwner = false;
  if (conv.businessId) {
    const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, conv.businessId)).limit(1);
    isBusinessOwner = biz?.ownerId === user.id;
  }
  const isAdmin = user.role === "admin";
  if (!canAccessConversation(conv, user.id, isBusinessOwner, isAdmin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const role = isAdmin ? "admin" : isBusinessOwner ? "business" : conv.riderId === user.id ? "rider" : "customer";
  setTyping(id, role, user.name ?? "Someone");
  return res.json({ ok: true });
});

// GET /conversations/:id/typing-status — is someone else in this conversation typing?
router.get("/:id/typing-status", requireAuth, async (req: Request<IdParams>, res) => {
  const user = (req as any).currentUser;
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  let isBusinessOwner = false;
  if (conv.businessId) {
    const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, conv.businessId)).limit(1);
    isBusinessOwner = biz?.ownerId === user.id;
  }
  const isAdmin = user.role === "admin";

  const myRole = isAdmin ? "admin" : isBusinessOwner ? "business" : conv.riderId === user.id ? "rider" : "customer";
  return res.json(getOtherTyping(id, myRole));
});

// PATCH /conversations/:id/reassign — admin reassigns conversation to store
router.patch("/:id/reassign", requireAuth, async (req: Request<IdParams>, res) => {
  const user = (req as any).currentUser;
  if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  await db.update(conversationsTable)
    .set({ status: "active", assignedTo: "store" })
    .where(eq(conversationsTable.id, id));

  const enriched = await enrichConversation({ ...conv, status: "active", assignedTo: "store" });
  return res.json(enriched);
});

export default router;
