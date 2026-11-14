# Deck Builder

A solo deck-building card game about building a deck. The wooden kind. With a deck. Of cards.

**Play it: https://deck-builder-porch.web.app**

The barbecue is in 14 days and there is no deck to hold it on. Start with ten weak cards,
buy better ones from the Yard, and build an engine strong enough to finish all five sections
(220 Work) before the guests arrive.

- **Five colours, five plans.** Framing stacks, Power Tools multiply, Crew draws, Business
  pays, Site cleans up. The strongest decks mix two or more.
- **Order matters.** Each card changes the day's running total when it is played.
- **Nothing is hidden** except the order of your own draw pile. All 14 nights of hazards
  are visible from day 1.
- Works with a mouse or on a touch screen in landscape. A tutorial is built in.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run sim` | Headless bots play 100 games each and report win rates |
| `npm run odds` | Simplified one-day odds model |
| `npm run deploy` | Build and deploy to Firebase Hosting |

## How it is built

Vite, React, TypeScript and Motion. The game is a pure reducer (`src/game/engine.ts`) over
card data (`src/game/cards.ts`); the UI is a fixed 1280×720 stage scaled to the window.

- [DESIGN.md](DESIGN.md): the rules as implemented, balance numbers and the iteration log.
- [ENGINES.md](ENGINES.md): the reasoning and odds behind the five engines.
