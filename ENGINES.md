# Deck Builder v0.5 — engine plan, revision 2 (proposal, not implemented)

Status: **built as v0.5.** This file is the reasoning and the odds model. `DESIGN.md` describes
what is implemented, the simulator results, and where the build differs from this plan
(200 Work instead of 160, +$2 a day per section instead of +$1, and some card numbers).

## 1. The problem

A new player looks at five random Yard cards and cannot tell what a good deck looks like.
There is no visible destination, so every purchase is a guess, and the end of the game feels
like the start with slightly bigger numbers.

The fix has five parts:

1. Define a small number of **engines**: recognisable decks a player builds toward.
2. Give each engine a **colour**, so a glance at the Yard says "this is a piece of that".
3. Replace the random, changing row with a **fixed supply** (as in Dominion): every card you
   can buy this game is on the table from day 1 and stays there, so you can plan.
4. Make **combining engines** the point. One colour is a solid deck; two colours that feed
   each other is the deck people will remember.
5. Make the end of the game **explosive**: a finished engine should produce 10 to 50 times
   what the starting deck does.

Kept from today's game because it is working: play, spend, end day; cards that are readable
at a glance; one hazard a night; the animation.

## 2. What other games teach (research)

- **Dominion** is the model for planning. Every pile you can buy from is laid out before the
  first turn and never changes, so a player can look at the table and say "this game I am
  going to do X". Its classic lesson: a simple "buy the best plain card" deck beats a clumsy
  engine unless the goal is out of the plain deck's reach and thinning is available.
- **Slay the Spire / Balatro**: every strong run is built from an *enabler* (cheap, starts
  the plan), a *scaler* (makes it grow), and a *payoff* (turns it into a win). Multiplication
  is what creates the "I broke the game" feeling; addition never does.
- **Splendor** was useful for one idea only: showing cheap and expensive cards side by side
  from the start, so the destination is visible. Its discount system is **not** used.

## 3. Five colours

Four engines and one support colour. The current types (Hardware, Lumber, Tool, Crew, Deck)
are regrouped so that colour means "what this card is for". Wordplay cards keep a small
"Deck" mark but live in the colour of the engine they serve.

| Colour | Name | Engine | One-line plan a player can read |
|--------|------|--------|---------------------------------|
| Amber  | **Framing** (lumber and fasteners) | Stack | Every Lumber you play makes the next one bigger. Play lots. |
| Red    | **Power Tools** | Multiply | Build a small pile of Work, then double it. And again. |
| Green  | **Crew** | Draw | Draw your whole deck every day and get paid per card. |
| Gold   | **Business** | Money | Income that grows every day, then turn Cash into Work. |
| Slate  | **Site** (support) | none | Cover, immunity, tossing, fetching. Every engine needs a little. |

## 4. The engines, in mechanics

Each engine has an enabler (T1, the $3 row), a scaler (T2, the $6 row) and a payoff (T3, the $10 row). Each list shows candidate cards; a game uses one per row.
Numbers are starting points for simulation, not final.

### Stack (Framing, amber) — growth: quadratic in Lumber played

- T1 **Plank**: +2 Work. **Joist**: +2 Work, +1 for each Lumber played before it.
  **Deck Screws**: +1 Work, +2 if a Lumber was played before it.
- T2 **Joist Hanger**: +2 Work for each Lumber played before it.
  **Blocking** (Install): every Lumber you play gives +1 Work.
  **Baluster**: +1 Work, +2 for each Baluster played before it.
- T3 **Beam**: +6 Work and counts as three Lumber.
  **Ledger Board** (Install): each day, +1 Work for every 2 Lumber in your deck.
  **Picture Frame**: every Lumber played today gives +2 Work again.
- Wants: many amber cards, bigger hands. Does not need a thin deck, so it is the forgiving
  engine for new players.
- Weakness: capped by hand size until you add draw.

### Multiply (Power Tools, red) — growth: exponential in doublers played

- T1 **Circular Saw**: your next Lumber gives double. **Chalk Line**: +1 Work, +3 if played first.
  **Pilot Hole**: draw 1; your next fastener gives double.
- T2 **Tape Measure**: your next card is played twice.
  **Nail Gun**: double your Work so far (adds at most 10).
- T3 **Double Decker**: double your Work so far. No cap.
  **Table Saw** (Install): the first card you play each day is played twice.
- Wants: a thin deck (Clean-up and Toss cards), a couple of big payload cards, doublers played last.
- Weakness: a hand of doublers with nothing to double is worth zero.

### Draw (Crew, green) — growth: cards played per day, from 5 to the whole deck

- T1 **Helpful Neighbor**: +1 Work, draw 1. **Apprentice**: +$1, draw 1.
  **Deck of Cards**: draw 2.
- T2 **Contractor**: +4 Work, draw 2. **Foreman**: +2 Work, draw 1 for each Crew played before it.
  **Tool Belt** (Install): hand size +1.
- T3 **All Hands on Deck**: draw 3, +1 Work for each card played before it.
  **Deck the Halls**: +2 Work for each card played before it.
- Wants: lots of green, a little thinning. Pairs with every other engine because it finds
  their pieces.
- Weakness: draws do nothing by themselves; needs a payoff.

### Money (Business, gold) — growth: income compounds across days

- T1 **Side Hustle**: +$2. **Wheelbarrow**: +$3. **Deck Chair**: +$1, draw 1 extra tomorrow.
- T2 **Line of Credit** (Install): +$2 every day. **Pitch Deck**: double your Cash so far.
  **Flight Deck**: +$2, your next purchase lands in your hand.
- T3 **Sub It Out**: +1 Work for each $1 of Cash you have right now (the Cash is not spent).
  **Savings** (Install): unspent Cash carries over to tomorrow.
- Wants: installs early. Reaches the $10 payoffs of any colour first, so it is also the ramp for hybrids.
- Weakness: produces no Work until the payoff arrives.

### Site (slate) — support

Tarp, Deck Stain, Flashing, Pressure Treated, Permit, Poop Deck, Clear the Decks,
Stacked Deck, Tape Deck, Deckhand. Rental Dumpster is removed with the paid Dumpster.

## 5. The Yard: a fixed supply you can plan around

The Yard becomes a grid that is set up once and never changes during the game.

|            | Framing (amber) | Power Tools (red) | Crew (green) | Business (gold) | Site (slate) |
|------------|-----------------|-------------------|--------------|-----------------|--------------|
| Enabler $3 | pile            | pile              | pile         | pile            | Plank, Side Hustle |
| Scaler $6  | pile            | pile              | pile         | pile            | a Toss card  |
| Payoff $10 | pile            | pile              | pile         | pile            | a Cover or immunity card |

- **Columns are engines, rows are price.** Reading down a column is that engine's whole plan.
  Reading across is what you can afford today.
- **Flat prices by row** ($3, $6, $10). No discounts, nothing to calculate.
- **Each pile holds several copies** of one card (about 5 / 4 / 2 by row), so buying the same
  enabler three times is a real option and payoffs are scarce.
- **Variety comes between games, not during one.** Each cell has two or three candidate
  cards in the pool; a new game picks one per cell. The engines are always the same four, the
  exact pieces differ, and the player sees all of them on day 1.
- **No conveyor, no "arriving next".** Nothing leaves and nothing is hidden. The only
  randomness left in a game is the shuffle of your own deck.
- **Larger market cards**: fifteen piles in a 5 x 3 grid of landscape tiles with 14 px text,
  tinted by column colour. A bought card flies to the discard pile and becomes a normal
  portrait card. The captions under market cards are removed.

Approachability check: a new player reads four column headings ("play lots of Lumber",
"double it", "draw everything", "get rich"), picks one, and buys down that column. That is a
complete, winning-capable strategy with no rules knowledge beyond today's game.

## 5a. Combining engines

Payoffs are written so that they reward what *another* colour produces. This is where a
player's deck becomes their own.

| Pair | Why it works |
|------|--------------|
| Stack + Draw | Stack is capped by hand size; Crew removes the cap. More Lumber per day, each bigger than the last. |
| Stack + Multiply | Circular Saw doubles the last, largest Joist; Double Decker doubles the whole stack. |
| Draw + Multiply | Draw finds every payload and every doubler every day. The highest ceiling in the game. |
| Money + anything | Reaches the $10 payoffs days earlier, and buys two cards a day late on. |
| Money + Draw | Draw the whole deck's Cash, then Sub It Out turns it all into Work. |
| Money + Multiply | Pitch Deck doubles Cash before Sub It Out; Double Decker doubles the result. |

Design rules that keep combinations open:

- Payoffs count things any colour can make (Work so far, Cash so far, cards played today),
  not only their own colour's cards. Enablers and scalers are where colour identity lives.
- Two colours should beat one; three should usually be too diluted to beat two. The
  simulator checks this (section 7.3).
- No card requires another specific card to function. Every card does something alone.

## 5b. Keeping the deck lean, without paying for it

The $1 Dumpster is removed. Thinning should be a reward and a plan, not a fee.

- **Clean-up**: each time you finish a section of the deck, you may toss up to 2 cards from
  anywhere in your deck (pick from a list). Four sections before the last means up to 8
  tosses a game, which is enough to remove most of the starting cards. Building early now
  directly makes the engine sharper, which ties the two halves of the game together.
- **One Toss card is always in the Site column** (for example Poop Deck: +$1, toss a card
  from your hand). Players who want a very lean deck can go deeper.
- **Splinters**: playing a Splinter removes it. It costs you one slot in one hand, once.
- **Install** cards still leave the deck when played.
- Holding unplayed cards in hand stays.

Considered and not recommended: a free toss every day. It would be the correct move every
single day for the first week, which makes it a chore rather than a decision.

## 6. Power curve

The starting deck makes 2 Work a day. Target for a well-built engine:

| Day            | 1 | 3 | 5 | 7  | 9  | 11 | 12 | 13 | 14  |
|----------------|---|---|---|----|----|----|----|----|-----|
| Work that day  | 2 | 3 | 6 | 12 | 25 | 45 | 65 | 90 | 120 |

That sums to roughly 450 over 14 days. A flat "buy the best Work card each day" deck tops out
near 8–10 Work a day, about 110 in total.

Proposed deck size: **300 Work**, in sections of 10 / 20 / 40 / 80 / 150. Flat play cannot
finish it; a working engine finishes with a day or two to spare; the last section is half the
deck and is built in two or three huge days.

Cash should follow the same shape: 3 a day at the start (one enabler a day), 6–8 by day 5
so scalers are routine, and $10 payoffs reachable from about day 7.

## 7. Odds

Computed by `tools/odds.cjs` (run `node tools/odds.cjs`), a simplified model of one day:
40,000 shuffled hands per row, cards played in a sensible order. It uses the mechanics above
but not the real card list, so treat it as a guide to shape, not a balance result.

### 7.1 Finding your pieces (exact)

Chance a 5-card hand holds at least one of your k key cards:

| Deck size | k=1 | k=2 | k=3 | k=4 |
|-----------|-----|-----|-----|-----|
| 8         | 63% | 89% | 98% | 100% |
| 10        | 50% | 78% | 92% | 98% |
| 15        | 33% | 57% | 74% | 85% |
| 20        | 25% | 45% | 60% | 72% |
| 25        | 20% | 37% | 50% | 62% |

Chance a 5-card hand holds **both** halves of a two-card combo (for example a payload and a doubler):

| Deck size | 1 of each | 2 of each | 3 of each |
|-----------|-----------|-----------|-----------|
| 8         | 36%       | 79%       | 96%       |
| 10        | 22%       | 58%       | 83%       |
| 15        | 10%       | 30%       | 51%       |
| 20        | 5%        | 18%       | 33%       |

Reading: one copy of a combo in a 20-card deck fires on 1 day in 20. Three copies in a
10-card deck fire on 5 days in 6. This is why piles hold several copies, and why Clean-up
gives enough tosses to get from 20 cards toward 10.

### 7.2 How each engine improves

Average Work per day (and the 90th-percentile day) as pieces are added.
"Start" is the 10-card starting deck.

**Stack**

| Deck | Cards | Avg Work | Good day |
|------|-------|----------|----------|
| Start | 10 | 2.0 | 3 |
| + 4 Lumber | 14 | 5.0 | 8 |
| + 8 Lumber, 2 Hangers | 20 | 8.1 | 15 |
| same, 4 starters tossed | 16 | 10.9 | 16 |
| same, hand of 7 | 16 | 18.8 | 30 |
| same, + 3 draw-2 cards | 19 | 25.7 | 40 |

Steady and reliable; hand size is the lever. It needs its payoff (Beam, Picture Frame, Ledger)
to reach the 60+ days the curve asks for.

**Multiply** (payload = a 6-Work card, doubler = double Work so far)

| Deck | Cards | Avg Work | Good day |
|------|-------|----------|----------|
| Start + 1 payload, 1 doubler | 12 | 5.7 | 14 |
| + 3 payloads, 3 doublers | 16 | 13.6 | 28 |
| same, 6 starters tossed | 10 | 28.8 | 52 |
| same, 8 starters tossed | 8 | 43.9 | 72 |
| only 3 payloads and 3 doublers, hand of 6 | 6 | 144 | 144 |

Same six cards, 13.6 or 144 depending on how lean the deck is. This engine is the purest
reward for thinning, and the one most in need of a cap or cost check in simulation.

**Draw** (cantrip = +1 Work and draw 1; payoff = +1 Work per card played before it)

| Deck | Cards | Cards played | Avg Work |
|------|-------|--------------|----------|
| Start + 2 cantrips, 1 payoff | 13 | 5.8 | 4.8 |
| + 4 cantrips, 2 draw-2, 1 payoff | 17 | 8.7 | 8.4 |
| + 6 cantrips, 4 draw-2, 2 payoffs | 22 | 12.0 | 18.6 |
| + 6 cantrips, 6 draw-2, 3 payoffs | 25 | 14.5 | 31.9 |
| same, 6 starters tossed | 19 | 18.6 (whole deck 95% of days) | 57.5 |

Slow to start, then it plays the entire deck every day and stops being random at all.

**Money**

| Deck | Cards | Avg Cash | Avg Work |
|------|-------|----------|----------|
| Start | 10 | 3.0 | 2.0 |
| + 4 Side Hustle, 1 Pitch Deck | 15 | 6.0 | 1.3 |
| 6 Odd Job, 5 Side Hustle, 2 Pitch, 2 Sub It Out | 15 | 8.7 | 4.6 |
| same, hand of 7 | 15 | 15.1 | 12.1 |

As modelled, Money is the weakest engine: cards alone cannot compound inside a 5-card hand.
That is why its scalers are **Installs** (Line of Credit, Savings) that pay every day without
needing to be drawn. Those are not in this model and must be tuned in the real simulator.

**Hybrids**

| Deck | Cards | Avg Work | Good day |
|------|-------|----------|----------|
| Draw + Multiply (4 starters, 10 draw cards, 3 payloads, 3 doublers) | 20 | 98.6 | 192 |
| Stack + Multiply (4 starters, 8 Lumber, 2 Hangers, 2 doublers) | 16 | 16.3 | 28 |

Draw + Multiply is the "go wild" deck. It should exist, and it should take most of the game
to assemble.

### 7.3 What the real simulator will report (once implemented)

- One bot per engine and per hybrid, each committed to its colour.
- For each: win rate, Work by day (the power curve), day the engine "turns on" (first day
  over 20 Work), and how often its payoff was bought.
- `npm run odds` regenerates the tables in this file from the real card list, so the
  document stays true as cards change.

Targets: every single-colour bot wins 25–45%; no engine above 60%; a flat no-engine bot 0%;
the best hybrid no more than 15 points above the best single colour.

## 8. Build order (after approval)

1. Rules: fixed grid supply, colour families, Clean-up, new and changed cards, 300-Work deck;
   remove the conveyor, the Dumpster and the estimate captions.
2. Simulator: one bot per engine and per pair, power-curve report, `npm run odds`.
3. Tune until the targets in 7.3 hold.
4. UI: the grid Yard with larger colour-tinted tiles; Clean-up picker; column headings.
5. Tutorial and Field guide: introduce the four engines on the first screen.

## 9. Decisions needed

1. **Fixed grid supply** (four engine columns by three price rows, plus a Site column), the
   same all game and re-rolled between games. Is this the structure you want?
2. **Thinning by Clean-up** (toss up to 2 on finishing a section) plus one Toss pile, with no
   paid Dumpster. Or a different trigger?
3. **Flat prices** of $3 / $6 / $10 by row.
4. **Scale**: 300 Work with 100+ Work days at the end, or a gentler curve.
5. **Pace panel**: keep "Work needed vs your deck's average", or remove it with the captions.

## 9a. Recommendations (revision 3)

Judged against three goals: easy to play, playable with real cards, challenging.
Figures marked "model" come from `tools/odds.cjs` or hand calculation, not the real simulator.

**1. Fixed grid: yes, 15 piles, and drop the two staples.**
Plank and Side Hustle duplicate the Framing and Business enablers, so the Site column needs
only three piles (Toss, Cover, one utility). 15 piles is smaller than a Dominion table (17).
About 90 cards in total: 44 engine, 12 Site, 10 starting, Splinters, 14 hazard cards.

**2. Thinning: Clean-up on finishing a section, from the cards in front of you.**
"Toss up to 2 of the cards you played today or still hold." Searching the draw pile is fiddly
with real cards and forces a reshuffle. Thinning is worth most early, so the first two
sections must be small enough to finish by about day 6.

**3. Prices $3 / $5 / $8, with a fixed opening and a built-in income ramp.**
- Opening: with 6 Odd Jobs in 10 cards, 52% of games have a day 1 or day 2 hand under $3
  (exact). Fix: the first two hands are always 3 Odd Jobs and 2 Nails. One line of setup.
- Starvation: a one-colour deck dilutes its Odd Jobs. The 20-card Stack deck averages $1.5 a
  day (model), so it could never buy a scaler. Fix: every finished section gives +$1 a day.
  This replaces the four different section perks with one rule.
- Late purchases: a card bought on day 8 into an 18-card deck is played about 1.7 more times.
  Fix: bought cards go on top of your draw pile, so you play them tomorrow. With that, $8
  payoffs bought around day 7 get three to four plays.

**4. Scale: about 160 Work, peak days of 40–60, not 300.**
Running totals must be workable in your head. 160 is still 20–30 times the starting deck's
2 Work a day, and above the roughly 110 that flat play reaches (model). Sections about
6 / 14 / 30 / 50 / 60. Final numbers come from the simulator.

**5. Pace panel: remove it, and print par on the calendar.**
The panel needs a simulation, which real cards cannot do. Instead each day on the calendar
shows the total Work a deck on track should have reached. Compare your marker to today's
number: no arithmetic, and it tells a new player when to worry.

**Other changes the real-cards rule forces**
- No effect may search or count the draw pile (Stacked Deck, "per Lumber in your deck").
- Hazards are a 14-card row dealt face up at setup.
- Work, Cash and Cover for the day are three dials or dice; progress is a marker on a track.

## 10. Revision notes

- Revision 2: dropped the colour discount and the three random tier decks (too much borrowed
  from Splendor, and still random within a game). Replaced with a Dominion-style fixed supply.
  Dropped pay-to-toss; thinning now comes from finishing sections. Added section 5a on
  combining engines as the core goal.
