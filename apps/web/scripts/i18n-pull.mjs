import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const apiUrl = process.env.TOLGEE_API_URL;
const apiKey = process.env.TOLGEE_API_KEY;
const projectId = process.env.TOLGEE_PROJECT_ID;

if (!apiUrl || !apiKey || !projectId) {
  console.error('Missing Tolgee env vars: TOLGEE_API_URL, TOLGEE_PROJECT_ID, TOLGEE_API_KEY.');
  process.exit(1);
}

const exportUrl = new URL(`/v2/projects/${projectId}/export`, apiUrl);
exportUrl.searchParams.set('format', 'JSON_I18NEXT');
exportUrl.searchParams.set('structureDelimiter', '.');
exportUrl.searchParams.set('supportArrays', 'true');
exportUrl.searchParams.set('zip', 'true');

const response = await fetch(exportUrl.toString(), {
  headers: {
    'X-API-Key': apiKey,
  },
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Tolgee export failed: ${response.status} ${response.statusText}`);
  console.error(body.slice(0, 500));
  process.exit(1);
}

const buffer = Buffer.from(await response.arrayBuffer());
const zip = await JSZip.loadAsync(buffer);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(scriptDir, '..', 'messages');
await mkdir(outDir, { recursive: true });

const SUPPORTED = new Set(['en', 'es']);

function normalizeLocale(tag) {
  return tag.trim().toLowerCase().split(/[-_]/)[0];
}

const keptLists = [];

function mergeMessages(local, remote, path = '') {
  if (Array.isArray(local) && Array.isArray(remote)) {
    if (local.length !== remote.length) {
      keptLists.push(`${path} (${local.length} committed, ${remote.length} exported)`);
      return local;
    }
    return local.map((item, index) => mergeMessages(item, remote[index], `${path}.${index}`));
  }
  if (Array.isArray(remote) || typeof remote !== 'object' || remote === null) return remote;
  if (Array.isArray(local) || typeof local !== 'object' || local === null) return remote;
  const merged = { ...local };
  for (const [key, value] of Object.entries(remote)) {
    const at = path ? `${path}.${key}` : key;
    merged[key] = key in local ? mergeMessages(local[key], value, at) : value;
  }
  return merged;
}

function isFlatExport(messages) {
  if (!messages || typeof messages !== 'object' || Array.isArray(messages)) return false;
  return Object.keys(messages).some((key) => key.includes('.') || key.includes('['));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])])
    );
  }
  return value;
}

async function readLocal(dest) {
  let raw;
  try {
    raw = await readFile(dest, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(
      `${path.relative(process.cwd(), dest)} is not valid JSON (${error.message}). ` +
        'Fix it, usually by resolving a merge conflict, and pull again. Nothing was written.'
    );
    process.exit(1);
  }
}

const skipped = [];
const entries = [];
zip.forEach((relativePath, file) => {
  if (!relativePath.endsWith('.json')) return;
  const filename = path.basename(relativePath);
  const locale = normalizeLocale(filename.replace(/\.json$/i, ''));
  if (!SUPPORTED.has(locale)) {
    skipped.push(filename);
    return;
  }
  entries.push({ file, dest: path.join(outDir, `${locale}.json`) });
});

if (!entries.length) {
  console.error('Tolgee export zip contained no JSON files.');
  process.exit(1);
}

const results = [];
for (const { file, dest } of entries) {
  const remote = JSON.parse(await file.async('string'));
  if (isFlatExport(remote)) {
    console.error(
      `Tolgee returned dotted keys for ${path.basename(dest)}; the app reads a nested export. ` +
        'Check structureDelimiter and supportArrays on the project. Nothing was written.'
    );
    process.exit(1);
  }
  const local = await readLocal(dest);
  results.push({ dest, messages: local ? mergeMessages(local, remote) : remote });
}

await Promise.all(
  results.map(({ dest, messages }) =>
    writeFile(dest, JSON.stringify(sortKeys(messages), null, 2) + '\n', 'utf8')
  )
);
console.log(`Updated translations in ${outDir}`);
if (keptLists.length) {
  console.warn(
    `Kept the committed list for: ${keptLists.join(', ')} — the export has a different number ` +
      'of entries, which is a partial translation rather than an edit. Push, then pull again.'
  );
}
if (skipped.length) {
  console.warn(`Skipped unsupported locales from Tolgee: ${skipped.join(', ')}`);
}

const missing = [...SUPPORTED].filter(
  (locale) => !zip.file(new RegExp(`(^|/)${locale}(-[A-Za-z]+)?\\.json$`, 'i')).length
);
if (missing.length) {
  console.warn(
    `Tolgee has no export for: ${missing.join(', ')} — add the language to the project, ` +
      'or those locales will fall back to whatever is committed.'
  );
}
