import { Router, Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, caregiverLinksTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.use(requireAuth);

async function enrichLink(link: typeof caregiverLinksTable.$inferSelect, userId: number) {
  const otherId = link.caregiverId === userId ? link.travelerId : link.caregiverId;
  const [other] = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, phone: usersTable.phone })
    .from(usersTable)
    .where(eq(usersTable.id, otherId))
    .limit(1);
  return { ...link, otherUser: other };
}

router.get("/connections", async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const links = await db
    .select()
    .from(caregiverLinksTable)
    .where(or(eq(caregiverLinksTable.caregiverId, userId), eq(caregiverLinksTable.travelerId, userId)));
  const enriched = await Promise.all(links.map(l => enrichLink(l, userId)));
  res.json(enriched);
});

router.post("/connections", async (req: Request, res: Response) => {
  const userId = req.session.userId!;

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me) { res.status(401).json({ error: "Not found" }); return; }

  const schema = z.object({ targetUsername: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Provide targetUsername" }); return; }

  const [target] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, parsed.data.targetUsername.toLowerCase()))
    .limit(1);
  if (!target) { res.status(404).json({ error: `No user found with username "${parsed.data.targetUsername}"` }); return; }
  if (target.id === userId) { res.status(400).json({ error: "You can't link to yourself" }); return; }
  if (me.role === target.role) {
    res.status(400).json({ error: `Both accounts are ${me.role}s — one must be a traveler and the other a caregiver.` });
    return;
  }

  const caregiverId = me.role === "caregiver" ? me.id : target.id;
  const travelerId = me.role === "traveler" ? me.id : target.id;

  const existing = await db
    .select()
    .from(caregiverLinksTable)
    .where(and(eq(caregiverLinksTable.caregiverId, caregiverId), eq(caregiverLinksTable.travelerId, travelerId)))
    .limit(1);

  if (existing.length > 0 && existing[0].status !== "rejected") {
    res.status(409).json({ error: "A connection with this user already exists" });
    return;
  }

  const status: "pending_traveler_accept" | "pending_caregiver_accept" =
    me.role === "caregiver" ? "pending_traveler_accept" : "pending_caregiver_accept";

  const [link] = await db
    .insert(caregiverLinksTable)
    .values({ caregiverId, travelerId, status, initiatedByRole: me.role, updatedAt: new Date() })
    .returning();

  res.status(201).json(await enrichLink(link, userId));
});

router.put("/connections/:id/accept", async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const linkId = parseInt(req.params.id as string);

  const [link] = await db.select().from(caregiverLinksTable).where(eq(caregiverLinksTable.id, linkId)).limit(1);
  if (!link) { res.status(404).json({ error: "Connection not found" }); return; }

  const isRecipient =
    (link.status === "pending_traveler_accept" && link.travelerId === userId) ||
    (link.status === "pending_caregiver_accept" && link.caregiverId === userId);
  if (!isRecipient) { res.status(403).json({ error: "Not authorized to accept this connection" }); return; }

  const [updated] = await db
    .update(caregiverLinksTable)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(caregiverLinksTable.id, linkId))
    .returning();
  res.json(await enrichLink(updated, userId));
});

router.put("/connections/:id/reject", async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const linkId = parseInt(req.params.id as string);

  const [link] = await db.select().from(caregiverLinksTable).where(eq(caregiverLinksTable.id, linkId)).limit(1);
  if (!link) { res.status(404).json({ error: "Connection not found" }); return; }
  if (link.caregiverId !== userId && link.travelerId !== userId) {
    res.status(403).json({ error: "Not authorized" }); return;
  }

  const [updated] = await db
    .update(caregiverLinksTable)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(caregiverLinksTable.id, linkId))
    .returning();
  res.json(await enrichLink(updated, userId));
});

router.delete("/connections/:id", async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const linkId = parseInt(req.params.id as string);

  const [link] = await db.select().from(caregiverLinksTable).where(eq(caregiverLinksTable.id, linkId)).limit(1);
  if (!link) { res.status(404).json({ error: "Connection not found" }); return; }
  if (link.caregiverId !== userId && link.travelerId !== userId) {
    res.status(403).json({ error: "Not authorized" }); return;
  }

  await db.delete(caregiverLinksTable).where(eq(caregiverLinksTable.id, linkId));
  res.json({ ok: true });
});

export default router;
