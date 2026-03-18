import { Router, type IRouter } from "express";
import { db, sessionsTable, messagesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const sessionRows = await db
    .select({
      id: sessionsTable.id,
      userId: sessionsTable.userId,
      title: sessionsTable.title,
      createdAt: sessionsTable.createdAt,
      updatedAt: sessionsTable.updatedAt,
      messageCount: sql<number>`cast(count(${messagesTable.id}) as int)`,
    })
    .from(sessionsTable)
    .leftJoin(messagesTable, eq(messagesTable.sessionId, sessionsTable.id))
    .where(eq(sessionsTable.userId, userId))
    .groupBy(sessionsTable.id)
    .orderBy(desc(sessionsTable.updatedAt));

  res.json(sessionRows);
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { title } = req.body;

  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const [session] = await db
    .insert(sessionsTable)
    .values({ userId, title })
    .returning();

  res.status(201).json({
    id: session.id,
    userId: session.userId,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: 0,
  });
});

router.get("/:sessionId", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const sessionId = parseInt(String(req.params["sessionId"] ?? "0"));

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);

  if (!session || session.userId !== userId) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, sessionId))
    .orderBy(messagesTable.createdAt);

  res.json({
    id: session.id,
    userId: session.userId,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messages,
  });
});

router.patch("/:sessionId", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const sessionId = parseInt(String(req.params["sessionId"] ?? "0"));
  const { title } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);

  if (!session || session.userId !== userId) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const [updated] = await db
    .update(sessionsTable)
    .set({ title: title.trim().toUpperCase() })
    .where(eq(sessionsTable.id, sessionId))
    .returning();

  res.json({
    id: updated.id,
    userId: updated.userId,
    title: updated.title,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});

router.delete("/:sessionId", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const sessionId = parseInt(String(req.params["sessionId"] ?? "0"));

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);

  if (!session || session.userId !== userId) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));

  res.json({ message: "Session deleted successfully" });
});

export default router;
