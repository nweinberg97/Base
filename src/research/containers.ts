// Container planning and deposit accounting.
//
// Each prepped ingredient goes into the smallest container that holds it. Cooked
// legumes weigh about 2.4× their dry weight, so they are planned at cooked weight.
// Spoonable dairy goes into returnable jars. Food is never split across sizes except
// when it exceeds the largest container.

export interface ContainerSpec {
  slug: string;
  name: string;
  capacityG: number;
  deposit: number;
  purchasePrice: number;
  kind: 'glass' | 'jar';
}

export interface ContainerNeed {
  slug: string;              // ingredient slug
  quantityG: number;
  needsContainer: boolean;
  category: string;
  prepForm: string;
}

export const COOKED_LEGUME_FACTOR = 2.4;

export function plannedWeight(n: ContainerNeed): number {
  if (n.category === 'legume' && /cooked/i.test(n.prepForm)) return n.quantityG * COOKED_LEGUME_FACTOR;
  return n.quantityG;
}

/** Returns container slug → count. */
export function planContainers(needs: ContainerNeed[], specs: ContainerSpec[]): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (slug: string, n = 1) => counts.set(slug, (counts.get(slug) ?? 0) + n);
  const glass = specs.filter((s) => s.kind === 'glass').sort((a, b) => a.capacityG - b.capacityG);
  const jars = specs.filter((s) => s.kind === 'jar').sort((a, b) => a.capacityG - b.capacityG);
  if (!glass.length) throw new Error('No glass container sizes defined');

  for (const n of needs) {
    if (!n.needsContainer) continue;
    const w = plannedWeight(n);
    const pool = n.category === 'dairy' && jars.length ? jars : glass;
    const fit = pool.find((s) => s.capacityG >= w);
    if (fit) add(fit.slug);
    else {
      const largest = pool[pool.length - 1];
      add(largest.slug, Math.ceil(w / largest.capacityG));
    }
  }
  return counts;
}

export function depositFor(counts: Map<string, number>, specs: ContainerSpec[]): number {
  let total = 0;
  for (const [slug, n] of counts) {
    const spec = specs.find((s) => s.slug === slug);
    if (!spec) throw new Error(`Unknown container ${slug}`);
    if (!(spec.deposit >= 0)) throw new Error(`Invalid deposit for ${slug}`);
    total += spec.deposit * n;
  }
  return Math.round(total * 100) / 100;
}

export function purchaseCostFor(counts: Map<string, number>, specs: ContainerSpec[]): number {
  let total = 0;
  for (const [slug, n] of counts) total += specs.find((s) => s.slug === slug)!.purchasePrice * n;
  return Math.round(total * 100) / 100;
}

export interface AccountLine { containerSlug: string; borrowed: number; returned: number; owned: number }

/** A member's container balance: what is out, what deposit Base is holding. */
export function containerBalance(lines: AccountLine[], specs: ContainerSpec[]) {
  let active = 0;
  let depositHeld = 0;
  let owned = 0;
  for (const l of lines) {
    if (l.returned > l.borrowed) throw new Error(`Returned more ${l.containerSlug} than were borrowed`);
    if (l.borrowed < 0 || l.returned < 0 || l.owned < 0) throw new Error('Container counts cannot be negative');
    const spec = specs.find((s) => s.slug === l.containerSlug);
    if (!spec) throw new Error(`Unknown container ${l.containerSlug}`);
    const out = l.borrowed - l.returned;
    active += out;
    depositHeld += out * spec.deposit;
    owned += l.owned;
  }
  return { active, owned, depositHeld: Math.round(depositHeld * 100) / 100 };
}
