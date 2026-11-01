// `tsc` solo emite .js: copia a dist/ los .sql de migraciones que se leen en runtime.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [srcDir = 'src', outDir = 'dist'] = process.argv.slice(2);

const files = readdirSync(srcDir, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.sql'));

for (const file of files) {
  const target = join(outDir, file);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(join(srcDir, file), target);
}

console.log(`copied ${files.length} sql asset(s) to ${outDir}`);
