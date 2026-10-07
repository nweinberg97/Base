// Fetch candidate photos from Wikimedia Commons for review. Needs open internet,
// so it runs in GitHub Actions (.github/workflows/photo-candidates.yml).
//   node scripts/photos/candidates.ts [slug ...]
// Writes photo-candidates/<slug>/<n>.jpg and photo-candidates/<slug>/meta.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PHOTO_QUERIES } from './queries.ts';

const OUT = resolve(import.meta.dirname, '../../photo-candidates');
const UA = 'BasePrototype/0.1 (https://github.com/nweinberg97/Base; photo sourcing)';
const API = 'https://commons.wikimedia.org/w/api.php';
const PER_SLUG = Number(process.env.PER_SLUG) || 6;
const ALLOWED = /^(cc0|public domain|pd|cc by(-sa)? \d(\.\d)?)/i;

interface Candidate {
  title: string; url: string; thumb: string; width: number; height: number;
  author: string; license: string; licenseUrl: string; descriptionUrl: string; query: string;
}

const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function search(query: string): Promise<Candidate[]> {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '20',
    gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '900',
  });
  const res = await fetch(`${API}?${params}`, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`Commons ${res.status} for ${query}`);
  const data = await res.json() as { query?: { pages: Record<string, { title: string; index: number; imageinfo?: Array<Record<string, any>> }> } };
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const out: Candidate[] = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/image\/(jpeg|png)/.test(ii.mime)) continue;
    if (ii.width < 800 || ii.height < 500) continue;
    const md = ii.extmetadata ?? {};
    const license = strip(md.LicenseShortName?.value);
    if (!ALLOWED.test(license) || /nonfree|fair use/i.test(license)) continue;
    out.push({
      title: p.title, url: ii.url, thumb: ii.thumburl, width: ii.width, height: ii.height,
      author: strip(md.Artist?.value) || 'Unknown', license, licenseUrl: md.LicenseUrl?.value ?? '',
      descriptionUrl: ii.descriptionurl, query,
    });
  }
  return out;
}

const only = process.argv.slice(2);
for (const [slug, queries] of Object.entries(PHOTO_QUERIES)) {
  if (only.length && !only.includes(slug)) continue;
  const picked: Candidate[] = [];
  for (const q of queries) {
    try {
      for (const c of await search(q)) {
        if (picked.length >= PER_SLUG) break;
        if (!picked.some((x) => x.title === c.title)) picked.push(c);
      }
    } catch (err) { console.warn(String(err)); }
    if (picked.length >= PER_SLUG) break;
  }
  const dir = join(OUT, slug);
  mkdirSync(dir, { recursive: true });
  const meta = [];
  for (const [i, c] of picked.entries()) {
    const res = await fetch(c.thumb, { headers: { 'user-agent': UA } });
    if (!res.ok) { console.warn(`skip ${c.title}: ${res.status}`); continue; }
    writeFileSync(join(dir, `${i}.jpg`), Buffer.from(await res.arrayBuffer()));
    meta.push({ index: i, ...c });
  }
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log(`${slug}: ${meta.length} candidates`);
}
