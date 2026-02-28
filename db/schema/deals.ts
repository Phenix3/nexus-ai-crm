import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { contacts } from "./contacts";
import { pipelineStages } from "./pipeline-stages";
import { users } from "./users";

export const dealStatusEnum = pgEnum("deal_status", ["open", "won", "lost"]);

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("EUR").notNull(),
  probability: integer("probability").default(0).notNull(),
  expectedCloseDate: date("expected_close_date"),
  stageId: uuid("stage_id").references(() => pipelineStages.id, { onDelete: "set null" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  status: dealStatusEnum("status").default("open").notNull(),
  lostReason: text("lost_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
