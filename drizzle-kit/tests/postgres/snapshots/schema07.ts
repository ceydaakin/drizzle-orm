import { sql } from 'orm044';
import { check, customType, index, pgSchema, pgTable, text, uniqueIndex, uuid } from 'orm044/pg-core';

const geographyPoint = customType<{ data: string; driverData: string }>({
	dataType() {
		return 'geography(Point, 4326)';
	},
});

export const items = pgTable(
	'items',
	{
		id: uuid('id').primaryKey(),
		companyId: uuid('company_id').notNull(),
		identifier: text('identifier'),
		point: geographyPoint('point'),
	},
	(t) => [
		uniqueIndex('items_company_identifier_uniq')
			.on(t.companyId, sql`lower(${t.identifier})`)
			.where(sql`${t.identifier} IS NOT NULL`),
		index('items_identifier_idx').on(t.identifier).with({ fillfactor: 70, deduplicate_items: false }),
		check('items_identifier_format', sql`${t.identifier} IS NULL OR ${t.identifier} ~ '^"items".[0-9]{13}$'`),
	],
);

export const folder = pgSchema('folder');

export const files = folder.table('files', {
	name: text('name'),
}, (t) => [
	index('files_name_idx').on(t.name).where(sql`${t.name} <> 'x'`),
	check('files_name_check', sql`${t.name} <> ''`),
]);
