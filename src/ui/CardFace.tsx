import { COLOR_LABEL, type CardDef } from '../game/cards';
import { Icon } from './icons';

export function Chips({ d }: { d: CardDef }) {
  return (
    <div className="chips">
      {d.cash ? <span className="chip cash"><Icon id="coin" size={13} stroke={3} />+{d.cash}</span> : null}
      {d.work ? <span className="chip work"><Icon id="work" size={13} stroke={3} />+{d.work}</span> : null}
      {d.cover ? <span className="chip cover"><Icon id="cover" size={13} stroke={3} />+{d.cover}</span> : null}
      {d.draw ? <span className="chip draw"><Icon id="draw" size={13} stroke={3} />+{d.draw}</span> : null}
    </div>
  );
}

/** "Framing · Lumber", "Site · Install"... */
export function kindLine(d: CardDef): string {
  const parts = [COLOR_LABEL[d.color]];
  if (d.tags.includes('lumber')) parts.push('Lumber');
  if (d.tags.includes('fixture')) parts.push('Install');
  if (d.tags.includes('junk')) parts[0] = 'Junk';
  return parts.join(' · ');
}

/** The printed face of a card in your deck. */
export function CardFace({ d }: { d: CardDef }) {
  const long = (d.text?.length ?? 0) > 44;
  return (
    <div className={`face c-${d.color} ${d.tags.includes('fixture') ? 'is-fixture' : ''}`}>
      <div className="face-head">
        <span className={d.name.length > 16 ? 'face-name small' : 'face-name'}>{d.name}</span>
      </div>
      <div className="face-art"><Icon id={d.id} size={44} stroke={2} /></div>
      <div className="face-tag">{d.tags.includes('lumber') ? <em className="kind">Lumber</em> : kindLine(d)}</div>
      <Chips d={d} />
      {d.text && <div className="face-text">{d.text}</div>}
      {d.flavor && !long && <div className="face-flavor">{d.flavor}</div>}
    </div>
  );
}

/** A Yard pile: a larger landscape tile, easier to read than a hand card. */
export function Tile({ d, price, left, affordable }: { d: CardDef; price: number; left: number; affordable: boolean }) {
  return (
    <div className={`tile-in c-${d.color}`}>
      <div className="tile-head">
        <span className="tile-icon"><Icon id={d.id} size={26} stroke={2.4} /></span>
        <span className="tile-name">{d.name}{d.tags.includes('lumber') && <em className="kind">Lumber</em>}</span>
        <span className={`cost ${affordable ? 'ok' : ''}`}>${price}</span>
      </div>
      <div className="tile-body">
        <Chips d={d} />
        {d.text && <span className="tile-text">{d.text}</span>}
        {!d.text && d.flavor && <span className="tile-text flavor">{d.flavor}</span>}
      </div>
      <span className="tile-left">{left > 0 ? `${left} left` : 'Sold out'}</span>
    </div>
  );
}

export function CardBack() {
  return (
    <div className="back">
      <div className="back-inner">
        <svg width="56" height="56" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 20h38M5 20v6h38v-6M9 26v14M39 26v14M24 26v14M9 20V9M39 20V9M5 9h38M17 9v11M24 9v11M31 9v11" />
        </svg>
      </div>
    </div>
  );
}
