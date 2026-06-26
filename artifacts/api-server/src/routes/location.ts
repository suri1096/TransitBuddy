import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable, caregiverLinksTable, travelerLocationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  next();
}

const putSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number(),
  tripProgress: z.any().optional(),
});

router.put("/location", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me || me.role !== "traveler") { res.status(403).json({ error: "Only travelers can share location" }); return; }

  const parsed = putSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const { lat, lng, accuracy, tripProgress } = parsed.data;
  const now = new Date();

  await db
    .insert(travelerLocationsTable)
    .values({ travelerId: userId, lat, lng, accuracy, tripProgress: tripProgress ?? null, sharingEnabled: true, updatedAt: now })
    .onConflictDoUpdate({
      target: travelerLocationsTable.travelerId,
      set: { lat, lng, accuracy, tripProgress: tripProgress ?? null, sharingEnabled: true, updatedAt: now },
    });

  res.json({ ok: true });
});

router.delete("/location", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  await db
    .update(travelerLocationsTable)
    .set({ sharingEnabled: false, updatedAt: new Date() })
    .where(eq(travelerLocationsTable.travelerId, userId));
  res.json({ ok: true });
});

router.get("/location/:travelerId", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const travelerId = parseInt(req.params.travelerId as string);
  if (isNaN(travelerId)) { res.status(400).json({ error: "Invalid travelerId" }); return; }

  const [link] = await db
    .select()
    .from(caregiverLinksTable)
    .where(and(eq(caregiverLinksTable.caregiverId, userId), eq(caregiverLinksTable.travelerId, travelerId), eq(caregiverLinksTable.status, "accepted")))
    .limit(1);
  if (!link) { res.status(403).json({ error: "No accepted link with this traveler" }); return; }

  const [loc] = await db
    .select()
    .from(travelerLocationsTable)
    .where(eq(travelerLocationsTable.travelerId, travelerId))
    .limit(1);
  if (!loc || !loc.sharingEnabled) { res.status(404).json({ error: "Location not available" }); return; }

  res.json(loc);
});

export default router;
