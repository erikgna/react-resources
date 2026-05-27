# Personal Notes

## What was hard

- Getting the `selectFactory()` Strategy pattern to be type-safe without `as`. Used `Record<GuitarType, GuitarFactory>` — compiler enforces exhaustiveness.
- Next.js in-memory singleton: hot reload wipes module state. Had to add try/catch in seed to avoid duplicate key errors on re-seed.
- TanStack Query invalidation: `invalidateQueries({ queryKey: ['inventory'] })` must match the base key used in `useInventory`. Partial key matching is the right mental model.

## What to explore next (impl_2 through impl_10)

- Rebuild `GuitarBuilder` from memory without looking — focus on the `this` return type for chaining
- Try a `Director` class that pre-configures common guitar setups (Strat-style, LP-style)
- Try a `Prototype` pattern alternative: clone a guitar and modify the copy
- Read Next.js App Router source to understand when RSC boundary is crossed

## Repetition log

- `impl_1.ts` — built with reference
- `impl_2.ts` through `impl_10.ts` — to be completed from memory
