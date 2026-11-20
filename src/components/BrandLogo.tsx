import { GAME_CREDIT, GAME_TAGLINE } from '../game/config';

export function DeveloperBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-lg border border-sky-400/40 bg-[#07152e] shadow-[0_0_20px_rgba(14,165,233,0.22)] ${
        compact ? 'px-3.5 py-1.5' : 'px-5 py-2'
      }`}
    >
      <span
        className="inline-block h-2 w-2 rounded-xs bg-sky-400 shadow-[0_0_8px_#38bdf8]"
        aria-hidden="true"
      />
      <span
        className={`font-display font-bold tracking-[0.16em] text-sky-100 ${
          compact ? 'text-[11px]' : 'text-xs sm:text-sm'
        }`}
      >
        {GAME_CREDIT}
      </span>
    </div>
  );
}

export function BrandLogo({ size = 'lg' }: { size?: 'md' | 'lg' }) {
  const isLarge = size === 'lg';
  return (
    <div className="flex flex-col items-center select-none">
      <svg
        viewBox="0 0 560 128"
        className={isLarge ? 'w-[310px] sm:w-[440px] md:w-[500px] h-auto drop-shadow-[0_10px_18px_rgba(7,18,38,0.6)]' : 'w-[240px] h-auto'}
        role="img"
        aria-label="JUMPVERSE"
      >
        <defs>
          <linearGradient id="jvTextGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="48%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <linearGradient id="jvBlueGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>

        {/* Decorative adventure ribbon */}
        <path
          d="M 46 92 Q 280 116 514 92 L 502 108 Q 280 130 58 108 Z"
          fill="url(#jvBlueGrad)"
          stroke="#071226"
          strokeWidth="4"
        />

        {/* Cartoon explorer star emblem */}
        <polygon
          points="42,42 49,25 56,42 74,44 60,55 64,72 49,63 34,72 38,55 24,44"
          fill="#38BDF8"
          stroke="#071226"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <polygon
          points="518,42 525,25 532,42 550,44 536,55 540,72 525,63 510,72 514,55 500,44"
          fill="#4ADE80"
          stroke="#071226"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* 3D Extrusion Shadow */}
        <text
          x="280"
          y="82"
          textAnchor="middle"
          fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
          fontWeight="700"
          fontSize="74"
          letterSpacing="3"
          fill="#071226"
          stroke="#071226"
          strokeWidth="16"
          strokeLinejoin="round"
          transform="translate(0, 6)"
        >
          JUMPVERSE
        </text>

        {/* Main Cartoon Title */}
        <text
          x="280"
          y="82"
          textAnchor="middle"
          fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
          fontWeight="700"
          fontSize="74"
          letterSpacing="3"
          fill="url(#jvTextGrad)"
          stroke="#0F172A"
          strokeWidth="7"
          paintOrder="stroke fill"
          strokeLinejoin="round"
        >
          JUMPVERSE
        </text>
      </svg>

      <p
        className={`mt-1 font-display font-semibold tracking-[0.26em] text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)] ${
          isLarge ? 'text-xs sm:text-sm' : 'text-[11px]'
        }`}
      >
        {GAME_TAGLINE}
      </p>
    </div>
  );
}
