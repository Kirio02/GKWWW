import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'src', 'utils', 'projectFilesSnapshot.ts');

const ignoreDirs = new Set(['node_modules', 'dist', '.git', 'android', '.aistudio']);
const ignoreFiles = new Set(['bun.lock', '.dev.env.json', '.dev.pid', 'start.sh']);

function collectFiles(dir, relativeDir = '') {
  let entries = {};
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (ignoreDirs.has(item) || ignoreFiles.has(item)) continue;
    const fullPath = path.join(dir, item);
    const relPath = relativeDir ? `${relativeDir}/${item}` : item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      Object.assign(entries, collectFiles(fullPath, relPath));
    } else {
      if (relPath.includes('projectFilesSnapshot.ts')) continue;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        entries[relPath] = content;
      } catch (err) {
        console.warn(`Skipping binary or unreadable file: ${relPath}`);
      }
    }
  }
  return entries;
}

const files = collectFiles(rootDir);

const content = `/**
 * Pre-bundled snapshot of all project files for client-side JSZip exporting.
 * Generated automatically.
 */
export const PROJECT_SOURCE_FILES: Record<string, string> = ${JSON.stringify(files, null, 2)};
`;

fs.writeFileSync(outputFile, content, 'utf8');
console.log(`Snapshot generated with ${Object.keys(files).length} files.`);
