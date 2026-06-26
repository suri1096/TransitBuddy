import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const caregiverLinksTable = pgTable("caregiver_links", {
  id: serial("id").primaryKey(),
  caregiverId: integer("caregiver_id").notNull().references(() => usersTable.id),
  travelerId: integer("traveler_id").notNull().references(() => usersTable.id),
  status: text("status").notNull().$type<"pending_traveler_accept" | "pending_caregiver_accept" | "accepted" | "rejected">(),
  initiatedByRole: text("initiated_by_role").notNull().$type<"caregiver" | "traveler">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export type CaregiverLink = typeof caregiverLinksTable.$inferSelect;
