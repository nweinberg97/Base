# Base containers (draft specification)

Status: **Demo / draft.** Sizes, deposits and purchase prices below are working assumptions for the prototype. Base makes no oven, freezer, microwave or dishwasher claims until a final product specification is verified; the site describes the containers only as *designed to reduce prep and transfer steps*.

## Why containers matter

The Base arrives already portioned into the containers it will be stored in and prepped from. That removes a step at both ends of the week: nothing to unpack, less to wash, less packaging. The loop is:

**Pick up → Store → Prep → Cook → Eat → Return**

## Sizes

| Slug | Name | Size | Planning capacity | Deposit | Buy | Used for |
| --- | --- | --- | --- | --- | --- | --- |
| `glass-500` | Small glass container | 500 ml | 450 g | $3.00 | $9.00 | Aromatics, herbs, grains, smaller portions |
| `glass-jar-750` | Returnable glass jar | 750 ml | 900 g | $2.00 | $6.00 | Yogurt and other spoonable foods |
| `glass-1000` | Medium glass container | 1000 ml | 900 g | $4.00 | $12.00 | Prepped vegetables, cooked legumes, proteins |
| `glass-2000` | Large glass container | 2000 ml | 1800 g | $5.00 | $16.00 | Large batches such as potatoes and squash |

## Planning rule

`planContainers()` in `src/research/containers.ts`:

1. Skip ingredients that don't need a container (for example eggs, which come in a reusable carton).
2. Plan cooked legumes at **2.4×** their dry weight.
3. Dairy goes in jars; everything else in glass.
4. Use the smallest size whose planning capacity fits; if none fits, use as many of the largest as needed.

## Borrow, own or return

| Mode | Pay today | Later |
| --- | --- | --- |
| **Borrow** | Refundable deposit for each container | Bring them back clean at the next pickup; the deposit carries over |
| **Own** | One-time purchase price | Keep them; bring them to pickup to be refilled if you like |
| **Returning** | Nothing extra — your returned set covers this week | — |

The deposit is always shown separately from the food price. A member's container balance (`container_accounts`, `container_account_lines`) tracks borrowed, returned and owned containers per size; `containerBalance()` computes active containers and the deposit held, and refuses impossible states (returning more than were borrowed, negative counts).

## Open questions before this leaves draft

- Material and lid specification; temperature ratings for oven, freezer and dishwasher.
- Wash-and-sanitise process and its verified cost (the model assumes $0.40 per container).
- Loss and breakage rate, and how it affects the deposit.
