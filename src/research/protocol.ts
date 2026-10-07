// The weekly batch-cooking protocol, generated from a basket's ingredients.
// Plain rules by role, so any Base gets a short Sunday plan, not a recipe.

export interface ProtocolInput { name: string; slot: string; category: string; prepForm: string; family: string }

export interface Protocol { prep: string[]; mixes: string[] }

const lower = (s: string) => (/^(Greek|Brussels)\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export function batchProtocol(items: ProtocolInput[]): Protocol {
  const by = (slot: string) => items.filter((i) => i.slot === slot);
  const prep: string[] = [];

  for (const g of by('grain')) {
    prep.push(g.category === 'grain' && /oats/.test(g.family) ? `Portion the ${lower(g.name)} for breakfasts.` : `Cook all the ${lower(g.name)} in one pot.`);
  }
  for (const p of by('protein')) {
    prep.push(p.family === 'soy' ? `Press and cube the ${lower(p.name)}; crisp half of it.` : `Cook half the ${lower(p.name)} (roast or braise); keep half raw for later in the week.`);
  }
  for (const l of by('legume')) {
    prep.push(/cooked/.test(l.prepForm) ? `Your ${lower(l.name)} are already cooked. Roast a tray until crisp.` : `Simmer the ${lower(l.name)} until tender.`);
  }
  const roastable = by('vegetable').filter((v) => !['nightshade', 'fungi'].includes(v.family) || v.family === 'fungi');
  if (roastable.length) prep.push(`Roast the ${list(roastable.map((v) => lower(v.name)))} on two trays.`);
  for (const g of by('green')) prep.push(`Your ${lower(g.name)} is washed. Keep it dry in its container.`);
  const fresh = [...by('fresh-flavor'), ...by('rich-flavor')];
  if (fresh.some((f) => f.category === 'dairy')) {
    const citrus = fresh.find((f) => f.family === 'citrus');
    prep.push(`Stir ${citrus ? 'lemon and ' : ''}garlic into the ${lower(fresh.find((f) => f.category === 'dairy')!.name)} for a sauce.`);
  }

  const protein = [...by('protein'), ...by('everyday-protein'), ...by('legume')].map((p) => lower(p.name));
  const grain = by('grain').map((g) => lower(g.name))[0] ?? 'grain';
  const veg = by('vegetable').map((v) => lower(v.name));
  const green = by('green').map((g) => lower(g.name))[0];
  const mixes = [
    `${cap(grain)} + roasted ${veg[0] ?? 'vegetables'} + ${protein[0] ?? 'protein'} + sauce`,
    `${cap(protein[1] ?? protein[0] ?? 'eggs')} + ${green ?? 'greens'} + whatever is left over`,
    `${cap(veg[veg.length - 1] ?? 'vegetables')} + ${protein[2] ?? protein[0] ?? 'beans'} + a spice blend`,
  ];
  return { prep, mixes };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
