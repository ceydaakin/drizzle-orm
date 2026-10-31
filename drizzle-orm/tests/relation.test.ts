import { expect, test } from 'vitest';

import { integer, pgSchema, pgTable } from '~/pg-core/index.ts';
import { createTableRelationsHelpers, extractTablesRelationalConfig, relations } from '~/relations.ts';

test('tables with same name in different schemas', () => {
	const folder = pgSchema('folder');
	const schema = {
		folder: {
			usersInFolder: folder.table('users', {}),
		},
		public: {
			users: pgTable('users', {}),
		},
	};

	const relationalSchema = {
		...Object.fromEntries(
			Object.entries(schema)
				.flatMap(([key, val]) => {
					// have unique keys across schemas

					const mappedTableEntries = Object.entries(val).map((tableEntry) => {
						return [`__${key}__.${tableEntry[0]}`, tableEntry[1]];
					});

					return mappedTableEntries;
				}),
		),
	};

	const relationsConfig = extractTablesRelationalConfig(
		relationalSchema,
		createTableRelationsHelpers,
	);

	expect(Object.keys(relationsConfig)).toHaveLength(2);
});

test('relational config is built once per schema object', () => {
	const users = pgTable('users', { id: integer('id').primaryKey() });
	const posts = pgTable('posts', { id: integer('id').primaryKey(), authorId: integer('author_id') });
	let configCalls = 0;
	const postsRelations = relations(posts, ({ one }) => {
		configCalls++;
		return { author: one(users, { fields: [posts.authorId], references: [users.id] }) };
	});
	const schema = { users, posts, postsRelations };

	const first = extractTablesRelationalConfig(schema, createTableRelationsHelpers);
	const second = extractTablesRelationalConfig(schema, createTableRelationsHelpers);

	expect(second).toBe(first);
	expect(configCalls).toBe(1);
	expect(extractTablesRelationalConfig({ ...schema }, createTableRelationsHelpers)).not.toBe(first);
});
