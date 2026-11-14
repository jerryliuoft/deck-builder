import { motion } from 'motion/react';
import { CONFIG, sectionStart } from '../game/engine';

/** Front elevation of the deck. Each section inks in as its Work is committed. */
export function Porch({ progress }: { progress: number }) {
  const frac = (i: number) => {
    const start = sectionStart(i);
    return Math.max(0, Math.min(1, (progress - start) / CONFIG.sections[i].work));
  };
  const layer = (i: number, children: React.ReactNode) => {
    const f = frac(i);
    return (
      <g>
        <g className="porch-ghost">{children}</g>
        <motion.g className={`porch-ink ${f >= 1 ? 'done' : ''}`} initial={false} animate={{ opacity: f === 0 ? 0 : 0.25 + 0.75 * f }}>
          {children}
        </motion.g>
      </g>
    );
  };
  const posts = [30, 96, 162, 228];
  return (
    <svg className="porch" viewBox="0 0 260 150" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path className="porch-ground" d="M4 138h252" />
      {/* 1 Footings */}
      {layer(0, posts.map((x) => <rect key={x} x={x - 9} y={126} width={18} height={12} rx={2} />))}
      {/* 2 Frame */}
      {layer(1, <>
        {posts.map((x) => <path key={x} d={`M${x} 126V92`} />)}
        <rect x={20} y={84} width={218} height={8} />
        <path d="M30 126L52 92M228 126L206 92" />
      </>)}
      {/* 3 Boards */}
      {layer(2, <>
        <rect x={14} y={77} width={230} height={7} />
        {Array.from({ length: 11 }, (_, k) => <path key={k} d={`M${33 + k * 19.2} 77v7`} />)}
      </>)}
      {/* 4 Railing */}
      {layer(3, <>
        <path d="M18 77V42M240 77V42M14 42h230M129 77V42" />
        {Array.from({ length: 15 }, (_, k) => <path key={k} d={`M${31 + k * 14} 49v28`} />)}
        <path d="M18 49h222" />
      </>)}
      {/* 5 Finish */}
      {layer(4, <>
        <path d="M244 84h12v13h-12M244 97h12v13h-12M244 110h12v13h-12M256 123v15" />
        <path d="M84 30a8 8 0 0 1 16 0zM92 30v12M82 42h20M78 18c2-4-2-5 0-9M92 16c2-4-2-5 0-9M106 18c2-4-2-5 0-9" />
        <path d="M158 42l6-16M186 42l-6-16M160 34h24M164 26h16" />
      </>)}
    </svg>
  );
}
