// The cost model. Food, deposit, container purchase and add-ons are always kept
// separate: a refundable deposit is never hidden inside the food price.

export const COST_RULES = {
  prepPerItem: 0.75,          // estimated labour to wash, cut or cook one ingredient (CAD)
  washPerContainer: 0.4,      // estimated cost to wash and sanitise one returned container (CAD)
  operatingMargin: 0.15,      // demo margin covering pickup, rent and overheads
};

export interface CostLine { pricePerKg: number; quantityG: number; prepared: boolean }

export function ingredientCost(lines: CostLine[]): number {
  let total = 0;
  for (const l of lines) {
    if (!(l.pricePerKg > 0)) throw new Error('Price per kg must be positive');
    if (!(l.quantityG > 0)) throw new Error('Quantity must be positive');
    total += (l.pricePerKg * l.quantityG) / 1000;
  }
  return Math.round(total * 100) / 100;
}

export interface BasketCost {
  ingredientCost: number;     // Estimated
  prepHandling: number;       // Estimated
  estimatedCost: number;      // ingredients + prep & handling
  margin: number;             // Demo
  foodPrice: number;          // what the customer pays for the food (prototype)
}

export function basketCost(lines: CostLine[], containerCount: number, rules = COST_RULES): BasketCost {
  const ing = ingredientCost(lines);
  const prepared = lines.filter((l) => l.prepared).length;
  const prepHandling = Math.round((prepared * rules.prepPerItem + containerCount * rules.washPerContainer) * 100) / 100;
  const estimatedCost = Math.round((ing + prepHandling) * 100) / 100;
  const margin = Math.round(estimatedCost * rules.operatingMargin * 100) / 100;
  const foodPrice = Math.ceil(estimatedCost + margin);   // rounded up to a whole dollar
  return { ingredientCost: ing, prepHandling, estimatedCost, margin, foodPrice };
}

export interface OrderSummary {
  foodPrice: number;
  addOns: number;
  depositRefundable: number;
  containerPurchase: number;
  totalToday: number;
}

/**
 * What the customer would pay today. Borrowing adds a refundable deposit; owning
 * replaces the deposit with a one-time container purchase.
 */
export function orderSummary(foodPrice: number, addOnPrices: number[], containers: { deposit: number; purchase: number }, mode: 'borrow' | 'own' | 'returning'): OrderSummary {
  for (const p of addOnPrices) if (!(p > 0)) throw new Error('Add-on prices must be positive');
  if (containers.deposit < 0 || containers.purchase < 0) throw new Error('Container amounts cannot be negative');
  const addOns = Math.round(addOnPrices.reduce((s, x) => s + x, 0) * 100) / 100;
  const depositRefundable = mode === 'borrow' ? containers.deposit : 0;
  const containerPurchase = mode === 'own' ? containers.purchase : 0;
  const totalToday = Math.round((foodPrice + addOns + depositRefundable + containerPurchase) * 100) / 100;
  return { foodPrice, addOns, depositRefundable, containerPurchase, totalToday };
}

/**
 * "Plates": servings of the protein-providing ingredients (protein, everyday
 * protein, legume). A plate is one of those plus sides from the rest of the Base.
 */
export function estimatePlates(items: { slot: string; estimatedServings: number }[]): number {
  return Math.round(items
    .filter((i) => ['protein', 'everyday-protein', 'legume'].includes(i.slot))
    .reduce((s, i) => s + i.estimatedServings, 0));
}
