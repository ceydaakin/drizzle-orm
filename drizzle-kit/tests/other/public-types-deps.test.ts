import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { expect, test } from 'vitest';

// https://github.com/drizzle-team/drizzle-orm/issues/6581
// The published index.d.ts is bundled from the declarations reachable from src/index.ts.
// Driver packages are not dependencies of drizzle-kit and may be missing in user projects,
// so those declarations must not import them.
test('main entry declarations do not import optional driver packages', { timeout: 120_000 }, () => {
	const entry = resolve(__dirname, '../../src/index.ts');
	const program = ts.createProgram([entry], {
		declaration: true,
		emitDeclarationOnly: true,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		target: ts.ScriptTarget.ES2022,
		types: ['node'],
	});

	const declarationOf = (file: string) => {
		let text = '';
		program.emit(program.getSourceFile(file), (_, data) => (text = data), undefined, true);
		return text;
	};

	const imported = new Set<string>();
	const visited = new Set<string>();
	const queue = [entry];
	while (queue.length) {
		const file = queue.pop()!;
		if (visited.has(file)) continue;
		visited.add(file);

		for (const { fileName: specifier } of ts.preProcessFile(declarationOf(file)).importedFiles) {
			if (!specifier.startsWith('.')) {
				imported.add(specifier);
				continue;
			}
			const base = resolve(dirname(file), specifier);
			const next = [`${base}.ts`, join(base, 'index.ts')].find((name) => program.getSourceFile(name));
			if (next) queue.push(next);
		}
	}

	expect(visited.size).toBeGreaterThan(1);
	expect([...imported].filter((specifier) => specifier.startsWith('@electric-sql/pglite'))).toStrictEqual([]);
});
