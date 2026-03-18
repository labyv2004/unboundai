import { Router, type IRouter } from "express";
import { db, memoriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const memories = await db
    .select()
    .from(memoriesTable)
    .where(eq(memoriesTable.userId, userId))
    .orderBy(desc(memoriesTable.createdAt));
  res.json(memories);
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { content, source = "user" } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [memory] = await db
    .insert(memoriesTable)
    .values({ userId, content: content.trim(), source })
    .returning();

  res.status(201).json(memory);
});

router.patch("/:memoryId", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const memoryId = parseInt(String(req.params["memoryId"] ?? "0"));
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(memoriesTable)
    .where(eq(memoriesTable.id, memoryId))
    .limit(1);

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }

  const [updated] = await db
    .update(memoriesTable)
    .set({ content: content.trim(), updatedAt: new Date() })
    .where(eq(memoriesTable.id, memoryId))
    .returning();

  res.json(updated);
});

router.delete("/:memoryId", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const memoryId = parseInt(String(req.params["memoryId"] ?? "0"));

  const [existing] = await db
    .select()
    .from(memoriesTable)
    .where(eq(memoriesTable.id, memoryId))
    .limit(1);

  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }

  await db.delete(memoriesTable).where(eq(memoriesTable.id, memoryId));
  res.json({ message: "Memory deleted" });
});

export default router;
