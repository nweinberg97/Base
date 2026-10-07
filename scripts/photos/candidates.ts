// Fetch candidate photos from Wikimedia Commons for review. Needs open internet,
// so it runs in GitHub Actions (.github/workflows/photo-candidates.yml).
//   node scripts/photos/candidates.ts [slug ...]
// Writes photo-candidates/<slug>/<n>.jpg and photo-candidates/<slug>/meta.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DISH_QUERIES, OPENVERSE_EXTRA, PHOTO_QUERIES, PREP_QUERIES } from './queries.ts';

const SET = (['prep', 'dish'] as const).find((x) => x === process.env.PHOTO_SET) ?? 'main';
const PROVIDER = process.env.PHOTO_SOURCE === 'openverse' ? 'openverse' : 'commons';
const BASE_QUERIES = SET === 'prep' ? PREP_QUERIES : SET === 'dish' ? DISH_QUERIES : PHOTO_QUERIES;
const QUERIES: Record<string, string[]> = PROVIDER === 'openverse'
  ? Object.fromEntries(Object.entries(BASE_QUERIES).map(([k, v]) => [k, [...(OPENVERSE_EXTRA[k] ?? []), ...v]]))
  : BASE_QUERIES;
const OUT = resolve(import.meta.dirname, '../../photo-candidates', PROVIDER === 'openverse' ? `ov-${SET}` : SET === 'main' ? '' : SET);
const UA = 'BasePrototype/0.1 (https://github.com/nweinberg97/Base; photo sourcing)';
const API = 'https://commons.wikimedia.org/w/api.php';
const PER_SLUG = Number(process.env.PER_SLUG) || 6;
const ALLOWED = /^(cc0|public domain|pd|cc by(-sa)? \d(\.\d)?)/i;

interface Candidate {
  title: string; url: string; thumb: string; width: number; height: number;
  author: string; license: string; licenseUrl: string; descriptionUrl: string; query: string;
}

const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function searchCommons(query: string): Promise<Candidate[]> {
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
    // Real photographs only: skip AI-generated images.
    if (/craiyon|stable diffusion|dall-?e|midjourney|ai[- ]generated/i.test(`${p.title} ${strip(md.Artist?.value)} ${strip(md.Categories?.value)}`)) continue;
    out.push({
      title: p.title, url: ii.url, thumb: ii.thumburl, width: ii.width, height: ii.height,
      author: strip(md.Artist?.value) || 'Unknown', license, licenseUrl: md.LicenseUrl?.value ?? '',
      descriptionUrl: ii.descriptionurl, query,
    });
  }
  return out;
}

/**
 * Openverse (api.openverse.org) indexes openly licensed images, mostly from Flickr.
 * Only licences that allow commercial use and adaptation: CC0, PDM, CC BY, CC BY-SA.
 */
async function searchOpenverse(query: string): Promise<Candidate[]> {
  const params = new URLSearchParams({ q: query, license: 'cc0,pdm,by,by-sa', page_size: '20', mature: 'false' });
  const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`Openverse ${res.status} for ${query}`);
  const data = await res.json() as { results: Array<Record<string, any>> };
  const out: Candidate[] = [];
  for (const r of data.results ?? []) {
    if ((r.width ?? 0) && (r.width < 640 || r.height < 420)) continue;
    const lic = String(r.license).toLowerCase();
    const license = lic === 'cc0' ? 'CC0' : lic === 'pdm' ? 'Public domain' : `CC ${lic.toUpperCase()} ${r.license_version ?? ''}`.trim();
    if (!ALLOWED.test(license)) continue;
    if (/craiyon|stable diffusion|dall-?e|midjourney|ai[- ]generated/i.test(`${r.title} ${r.creator}`)) continue;
    out.push({
      title: r.title ?? 'Untitled', url: r.url, thumb: r.url, width: r.width ?? 0, height: r.height ?? 0,
      author: r.creator ?? 'Unknown', license, licenseUrl: r.license_url ?? '', descriptionUrl: r.foreign_landing_url ?? r.url, query,
    });
  }
  return out;
}

const search = PROVIDER === 'openverse' ? searchOpenverse : searchCommons;
const only = process.argv.slice(2);
for (const [slug, queries] of Object.entries(QUERIES)) {
  if (only.length && !only.includes(slug)) continue;
  const picked: Candidate[] = [];
  for (const q of queries) {
    try {
      for (const c of await search(q)) {
        if (picked.length >= PER_SLUG) break;
        if (!picked.some((x) => x.title === c.title)) picked.push(c);
      }
    } catch (err) { console.warn(String(err)); }
    if (PROVIDER === 'openverse') await new Promise((r) => setTimeout(r, 3500));
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
