import { pgTable, integer, doublePrecision, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const travelerLocationsTable = pgTable("traveler_locations", {
  travelerId: integer("traveler_id").primaryKey().references(() => usersTable.id),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  accuracy: doublePrecision("accuracy").notNull(),
  tripProgress: json("trip_progress"),
  sharingEnabled: boolean("sharing_enabled").default(false).notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export type TravelerLocation = typeof travelerLocationsTable.$inferSelect;
