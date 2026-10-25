import { NAME } from 'constants/name';
import { pgTable } from 'drizzle-orm/pg-core';

export const users = pgTable(NAME, (t) => ({
	id: t.integer().primaryKey(),
}));
