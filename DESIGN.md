# Deck Builder — design document

A solo deck-building card game about building a deck. The wooden kind. With a deck. Of cards.

This file describes what is implemented (v0.5.2). `ENGINES.md` holds the reasoning, the odds
model and the simulator results behind it. The iteration log is at the bottom.

## 1. Pillars

1. **Deck building is the game.** You are building an engine, and you can see what it could become.
2. **Easy to play.** Play, spend, end the day. Four colours, three prices, one rule for progress.
3. **Playable with real cards.** Nothing searches or counts the draw pile; nothing needs a computer.
4. **Hard, but fair.** Nothing is hidden except the order of your own draw pile.
5. **Order and multiplication.** A hand is a small sequencing puzzle, and late hands are huge.
6. **Clean presentation.** No emoji, SVG line art, motion that explains what happened.

## 2. Goal

Finish all five sections of the deck (220 Work) within 14 days.
Grade by days to spare: 2+ Master Builder, 1 Journeyman, 0 Just in Time.

## 3. Setup

- Starting deck: 6 Odd Jobs (+$1) and 4 Nails (+1 Work). The first two hands are always
  3 Odd Jobs and 2 Nails, so there is no opening luck.
- The Yard: 15 piles in a grid, chosen once and never changed (section 5).
- Hazards: 14 nights dealt face up (section 7).

## 4. The turn (one day)

1. **Play** cards one at a time. Each changes today's running Cash, Work and Cover *when it is
   played*, so order matters. **Play all** (Space) plays the hand left to right.
2. **Spend** Cash: buy from the Yard.
3. **End the day.** Work goes into the deck. If a section was finished, do a Clean-up. Then
   tonight's hazard hits whatever Cover does not block. Played cards are discarded; unplayed
   cards stay in your hand; draw back up to 5.

**Bought cards go on top of your draw pile**, face up, so you play them tomorrow.

## 5. The Yard

|        | Framing | Power Tools | Crew | Business | Site |
|--------|---------|-------------|------|----------|------|
| $3 (5 copies) | enabler | enabler | enabler | enabler | a Toss card |
| $5 (4 copies) | scaler  | scaler  | scaler  | scaler  | Cover |
| $8 (2 copies) | payoff  | payoff  | payoff  | payoff  | utility |

Each cell has two or three candidate cards; a new game picks one per cell. The tutorial
always uses the same set.

| Colour | Engine | Plan |
|--------|--------|------|
| Framing (amber) | Stack | Play lots of Lumber. Each one makes the next bigger. |
| Power Tools (red) | Multiply | Play these last: they multiply the Work already made today. Needs another colour to feed it. |
| Crew (green) | Draw | Draw your whole deck and get paid for every card. |
| Business (indigo) | Money | Grow your income, then turn Cash into Work. |
| Site (slate) | Support | Thin your deck, block hazards, fetch cards. |

Cards (see `src/game/cards.ts` for exact text):

- **Framing**: Joist, Deck Board, Baluster · Joist Hanger, Blocking, Ledger Board · Beam, Picture Frame
- **Power Tools**: Circular Saw, Nail Gun · Miter Saw, Tape Measure · Double Decker
- **Crew**: Helpful Neighbor, Apprentice, Deck of Cards · Contractor, Foreman · All Hands on Deck, Deck the Halls
- **Business**: Side Hustle, Deck Chair · Line of Credit, Pitch Deck · Sub It Out, General Contractor
- **Site**: Poop Deck, Clear the Decks · Deck Stain, Flashing · Tape Deck, Tool Belt

Payoffs mostly count things any colour can make (Work so far, cards played, Cash in hand), so
colours combine. Each column heading says how to use the colour: play lots, play last,
play first, buy early, as needed.

## 6. Progress, income and Clean-up

Sections: Footings 8, Framing 20, Decking 40, Railing 66, Finish 86.

Finishing a section gives two things, always the same:

- **+$2 every day** for the rest of the game.
- **Clean-up**: toss up to 2 of the cards you played today or still hold. The game lays
  those cards out full size and explains the choice.

The only other ways to thin are the Site Toss card and Install cards (which leave the deck
when played). A Splinter is removed by playing it. There is no paid tossing.

**Par**: each day has a fixed total a build on track has reached by that night
(2, 4, 7, 9, 13, 22, 31, 44, 62, 81, 110, 150, 187, 220). The panel shows your total against
par. With real cards this is a row of numbers printed on the calendar.

## 7. Hazards and Cover

Every night's hazard and strength is visible from day 1. You cannot pay to stop one. You
plan around it (finish a section before Termites, spend Cash before the Inspector), or you
buy a Site card that gives Cover. Cover blocks point for point and is gone in the morning.
Sources: Deck Stain (+4 when played), Flashing (Install, +2 every night).

| Hazard | Each unblocked point |
|--------|----------------------|
| Rain | −2 Work at the start of tomorrow |
| Inspector | −$1 at the start of tomorrow |
| Termites | −3 progress on the current section |
| Splinters | a Splinter in your hand |

Week 1 strengths are 1–2; week 2 are 2–6. The End day button and the Tonight panel state
what tonight will cost in plain numbers, for example "-6 progress tonight".

## 8. Words on cards

Before this / so far (counts what you already played today) · Next (boosts the next card) ·
Install (leaves the deck, works every day) · Toss · Cover.

## 9. Tech

- Vite + React + TypeScript + Motion. Fixed 1280×720 stage scaled to fit.
- `src/game/engine.ts` pure reducer; `src/game/cards.ts` data; `src/game/auto.ts` sensible
  play order and deck estimate for bots; `src/game/sim.ts` engine bots.
- `npm run dev`, `npm run sim [games]`, `npm run odds` (the simplified model), `npm run build`.

## 10. Balance (100 games per bot, v0.5.2)

| Bot | Wins | Best day (avg) |
|-----|------|----------------|
| Never buys | 0% | 3 |
| $3 row only | 0% | 23 |
| Stack only | 6% | 35 |
| Multiply only | 0% | 21 |
| Draw only | 15% | 47 |
| Money only | 14% | 50 |
| Stack + Multiply | 21% | 50 |
| Stack + Draw | 36% | 63 |
| Stack + Money | 12% | 43 |
| Multiply + Draw | 54% | 122 |
| Multiply + Money | 12% | 52 |
| Draw + Money | 51% | 106 |
| All four colours | 62% | 136 |
| All four, Play-all order | 30% | 62 |
| All four, no thinning | 15% | 51 |

Every colour bot opens with two Business cards. Known problems are in the log below.

## 11. Iteration log

- **v0.1–0.3**: first rules; fixed "buy Planks every day" with a convex value curve.
- **v0.4**: running-total day model (order and multiplication), Play all, hazard strengths
  and Cover, Install cards, holding cards, field notes.
- **v0.5 (current)**, from playtest feedback that there was no visible strategy:
  - Four colour-coded engines plus Site; fixed 15-pile Yard; flat $3/$5/$8 rows.
  - Bought cards go on top of the draw pile.
  - One rule for finishing a section (+$2 a day and a Clean-up) replaces four perks.
  - Paid Dumpster, conveyor, staples, estimate captions and the pace simulation removed.
  - Fixed opening hands. Par line replaces the pace panel.
  - Real-cards rule: removed every effect that searched or counted the draw pile.
  - Deck resized from 74 to 200 Work; late days reach 40–90 Work.

### Differences from the plan in ENGINES.md

- 200 Work, not 160: at 160 every engine bot won most games.
- +$2 a day per section, not +$1: at +$1 no engine could afford the $8 row before day 10.
- Sub It Out is capped at +16 and the Draw payoffs were reduced, to rein in Draw + Money.
- Hazards hit harder per point (Rain ×2, Termites ×3) so Cover is worth buying late.

### v0.5.1, after the first v0.5 playtest

The player lost with Crew, Framing and one Business card; found Power Tools hard to use;
never considered Cover; and did not notice top-of-deck purchases or Clean-up.

- Power Tools reworked so every red card is a "play last" card that makes Work by itself.
  Chalk Line, 3-4-5 Triangle and Table Saw removed; Miter Saw added.
- Column headings say how to use each colour.
- Bought cards lie face up on the draw pile with an "In your hand tomorrow" tag.
- Clean-up is a full-screen prompt.
- Tonight's cost is stated in plain numbers.
- Deck raised from 200 to 220 Work.

### v0.5.2

- Buying Cover removed (the Tarp button and its key). In simulation it made the bots worse,
  and the first human playtest never considered it. Hazards are now something to plan
  around; Cover exists only on Site cards.
- The Tonight panel leads with what you will lose.

### v0.5.3

- Fixed Clean-up: a hovered card dropped behind the overlay, so it flickered and could not be clicked.
- Lumber cards carry a "Lumber" mark on the Yard tile and the card; card text says "Lumber card".
- Touch screens (landscape): no hover, so the first tap opens a large inspector with a
  Play / Buy / Toss button and a second tap acts. Portrait on a phone shows a "turn your
  phone sideways" screen. `?touch` in the URL forces touch mode on a desktop.
- The dev server listens on the local network so a phone can open it.

### Known problems for the next pass

- **Phones draw the board at about half size.** Names and numbers are readable, card text
  is read in the inspector. A real portrait layout would be a separate redesign.

- **One colour alone is now weak** (0–15%): single-colour bots take every hazard and have
  no answer. Two colours that feed each other win 21–54%. This matches the design goal
  (combine engines) but may be too punishing for a first game.
- **Multiply alone cannot win** (0%). It strongly helps Stack and Draw.
- **Late days are very large** (a best day of 100+ Work for Draw pairs), which is heavy
  arithmetic with real cards.
- Bots are simple; a human who holds cards and sequences well may find 220 too easy or too hard.

### Parked

Difficulty levels, daily seed, sound, drag to reorder hand, a printable card sheet.
