import { Router } from "express";
import { db } from "@workspace/db";
import {
  conversationsTable, chatMessagesTable, businessesTable, usersTable,
} from "@workspace/db";
import { eq, and, or, desc, isNull, ne } from "drizzle-orm";
import { requireAuth } from "../lib/authHelpers";

const router = Router();

async function enrichConversation(conv: typeof conversationsTable.$inferSelect) {
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, conv.customerId)).limit(1);
  const [business] = conv.businessId
    ? await db.select().from(businessesTable).where(eq(businessesTable.id, conv.businessId)).limit(1)
    : [];
  const [rider] = conv.riderId
    ? await db.select().from(usersTable).where(eq(usersTable.id, conv.riderId)).limit(1)
    : [];
  const [lastMsg] = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, conv.id))
    .orderBy(desc(chatMessagesTable.createdAt)).limit(1);

  return {
    ...conv,
    customerName: customer?.name ?? null,
    businessName: business?.name ?? null,
    riderName: rider?.name ?? null,
    lastMessage: lastMsg ? { body: lastMsg.body, senderId: lastMsg.senderId, createdAt: lastMsg.createdAt } : null,
  };
}

// POST /conversations — start (or reuse) a conversation
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const { businessId, riderId, deliveryId, subject } = req.body;

  if (!businessId && !riderId) {
    return res.status(400).json({ error: "businessId or riderId is required" });
  }

  let customerId = user.id;
  // If the current user IS the business owner or rider being messaged, the customerId is the other party's id from context — for simplicity, the initiator is always treated as the customer.
  const conditions = [eq(conversationsTable.customerId, user.id)];
  if (businessId) conditions.push(eq(conversationsTable.businessId, Number(businessId)));
  if (riderId) conditions.push(eq(conversationsTable.riderId, Number(riderId)));

  const [existing] = await db.select().from(conversationsTable).where(and(...conditions)).limit(1);
  if (existing) {
    const enriched = await enrichConversation(existing);
    return res.json(enriched);
  }

  const [conv] = await db.insert(conversationsTable).values({
    customerId,
    businessId: businessId ? Number(businessId) : null,
    riderId: riderId ? Number(riderId) : null,
    deliveryId: deliveryId ? Number(deliveryId) : null,
    subject: subject || null,
  }).returning();

  const enriched = await enrichConversation(conv);
  return res.status(201).json(enriched);
});

// GET /conversations — list conversations where I'm the customer, the business owner, or the rider
router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;

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

function canAccessConversation(conv: typeof conversationsTable.$inferSelect, userId: number, isBusinessOwner: boolean) {
  return conv.customerId === userId || conv.riderId === userId || isBusinessOwner;
}

// GET /conversations/:id/messages
router.get("/:id/messages", requireAuth, async (req, res) => {
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
  if (!canAccessConversation(conv, user.id, isBusinessOwner) && user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id))
    .orderBy(chatMessagesTable.createdAt);

  await db.update(chatMessagesTable)
    .set({ readAt: new Date() })
    .where(and(eq(chatMessagesTable.conversationId, id), isNull(chatMessagesTable.readAt), ne(chatMessagesTable.senderId, user.id)));

  return res.json(messages);
});

// POST /conversations/:id/messages
router.post("/:id/messages", requireAuth, async (req, res) => {
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
  if (!canAccessConversation(conv, user.id, isBusinessOwner) && user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const senderRole = isBusinessOwner ? "business" : conv.riderId === user.id ? "rider" : "customer";

  const [msg] = await db.insert(chatMessagesTable).values({
    conversationId: id,
    senderId: user.id,
    senderRole,
    body: String(body).trim().slice(0, 2000),
  }).returning();

  await db.update(conversationsTable).set({ lastMessageAt: new Date() }).where(eq(conversationsTable.id, id));

  return res.status(201).json(msg);
});

export default router;
