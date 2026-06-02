import { useTheme } from '@/lib/theme'

const STARS = Array.from({ length: 60 }, (_, i) => ({
  top:   `${(i * 47) % 62}%`,
  left:  `${(i * 71 + 13) % 100}%`,
  size:  (i % 3) + 1,
  delay: `${(i % 11) * 0.4}s`,
}))

const CLOUDS = [
  { top: '14%', left: '12%', scale: 1,    duration: '16s' },
  { top: '24%', left: '58%', scale: 0.8,  duration: '20s' },
  { top: '9%',  left: '78%', scale: 1.15, duration: '13s' },
]

export default function SceneryBackground() {
  const { nightOwl } = useTheme()

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 transition-opacity duration-[1600ms] ease-in-out bg-gradient-to-b from-sky-300 via-sky-100 to-amber-50"
        style={{ opacity: nightOwl ? 0 : 1 }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-[1600ms] ease-in-out bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900"
        style={{ opacity: nightOwl ? 1 : 0 }}
      />

      <div
        className="absolute inset-0 transition-opacity duration-[1600ms] ease-in-out"
        style={{ opacity: nightOwl ? 1 : 0 }}
      >
        {STARS.map((s, i) => (
          <span
            key={i}
            className="scenery-star"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      <div
        className="absolute transition-all duration-[1700ms] ease-in-out"
        style={{
          top: '8%',
          right: '16%',
          transform: nightOwl ? 'translateY(60vh) scale(0.8)' : 'translateY(0) scale(1)',
          opacity: nightOwl ? 0 : 1,
        }}
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-yellow-300 shadow-[0_0_80px_30px_rgba(253,224,71,0.6)]" />
        </div>
      </div>

      <div
        className="absolute transition-all duration-[1700ms] ease-in-out"
        style={{
          top: '10%',
          right: '18%',
          transform: nightOwl ? 'translateY(0) scale(1)' : 'translateY(-60vh) scale(0.8)',
          opacity: nightOwl ? 1 : 0,
        }}
      >
        <div className="w-20 h-20 rounded-full bg-slate-100 shadow-[0_0_60px_20px_rgba(226,232,240,0.35)] relative overflow-hidden">
          <div className="absolute w-5 h-5 rounded-full bg-slate-300/70 top-3 left-4" />
          <div className="absolute w-3 h-3 rounded-full bg-slate-300/70 top-10 left-10" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-slate-300/70 top-5 left-12" />
        </div>
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-[1600ms] ease-in-out"
        style={{ opacity: nightOwl ? 0 : 1 }}
      >
        {CLOUDS.map((c, i) => (
          <div
            key={i}
            className="scenery-cloud absolute"
            style={{ top: c.top, left: c.left, transform: `scale(${c.scale})`, animationDuration: c.duration }}
          >
            <div className="relative">
              <div className="w-28 h-9 bg-white/80 rounded-full" />
              <div className="absolute -top-4 left-6 w-14 h-14 bg-white/80 rounded-full" />
              <div className="absolute -top-2 left-16 w-12 h-12 bg-white/70 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <svg
        className="absolute bottom-0 left-0 w-full transition-opacity duration-[1600ms] ease-in-out"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: '38vh', opacity: nightOwl ? 0 : 1 }}
      >
        <path fill="#bbf7d0" d="M0,160 C240,80 480,200 720,160 C960,120 1200,200 1440,150 L1440,320 L0,320 Z" />
        <path fill="#86efac" d="M0,220 C300,160 600,260 900,220 C1140,190 1320,250 1440,220 L1440,320 L0,320 Z" />
        <path fill="#4ade80" d="M0,270 C360,240 720,300 1080,270 C1260,255 1380,285 1440,275 L1440,320 L0,320 Z" />
      </svg>

      <svg
        className="absolute bottom-0 left-0 w-full transition-opacity duration-[1600ms] ease-in-out"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: '38vh', opacity: nightOwl ? 1 : 0 }}
      >
        <path fill="#1e293b" d="M0,160 C240,80 480,200 720,160 C960,120 1200,200 1440,150 L1440,320 L0,320 Z" />
        <path fill="#172033" d="M0,220 C300,160 600,260 900,220 C1140,190 1320,250 1440,220 L1440,320 L0,320 Z" />
        <path fill="#0f172a" d="M0,270 C360,240 720,300 1080,270 C1260,255 1380,285 1440,275 L1440,320 L0,320 Z" />
      </svg>

      <div className="absolute bottom-[18vh] left-[8%] flex flex-col items-center">
        <div className="relative">
          <div
            className="w-28 h-28 rounded-full transition-colors duration-[1600ms]"
            style={{ backgroundColor: nightOwl ? '#14532d' : '#22c55e' }}
          />
          <span
            className="scenery-owl absolute -top-2 left-1/2 -translate-x-1/2 text-3xl transition-opacity duration-[1600ms]"
            style={{ opacity: nightOwl ? 1 : 0 }}
          >
            🦉
          </span>
        </div>
        <div
          className="w-5 h-20 -mt-2 rounded-b transition-colors duration-[1600ms]"
          style={{ backgroundColor: nightOwl ? '#3f2d1a' : '#92400e' }}
        />
      </div>

      <div
        className="absolute bottom-[15vh] right-[5%] transition-opacity duration-[1600ms] ease-in-out hidden md:block"
        style={{ opacity: nightOwl ? 0 : 1 }}
      >
        <svg width="240" height="180" viewBox="0 0 240 180">
          <ellipse cx="120" cy="166" rx="96" ry="9" fill="#000000" opacity="0.08" />
          <rect x="40" y="70" width="150" height="9" rx="3" fill="#a16207" />
          <rect x="40" y="86" width="150" height="9" rx="3" fill="#a16207" />
          <rect x="34" y="104" width="162" height="13" rx="3" fill="#b45309" />
          <rect x="48" y="117" width="10" height="38" fill="#78350f" />
          <rect x="172" y="117" width="10" height="38" fill="#78350f" />
          <rect x="100" y="104" width="10" height="44" rx="4" fill="#1f2937" />
          <rect x="128" y="104" width="10" height="44" rx="4" fill="#1f2937" />
          <path d="M94 106 q6 -38 24 -38 q18 0 24 38 z" fill="#4f46e5" />
          <circle cx="118" cy="56" r="13" fill="#f1c27d" />
          <path d="M105 55 a13 13 0 0 1 26 0 q-13 -11 -26 0 z" fill="#3b2417" />
          <rect x="103" y="84" width="32" height="22" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
          <circle cx="206" cy="150" r="6" fill="#16a34a" />
          <rect x="204" y="150" width="4" height="8" fill="#15803d" />
        </svg>
      </div>

      <div
        className="absolute bottom-[15vh] right-[5%] transition-opacity duration-[1600ms] ease-in-out hidden md:block"
        style={{ opacity: nightOwl ? 1 : 0 }}
      >
        <svg width="240" height="180" viewBox="0 0 240 180">
          <ellipse cx="120" cy="168" rx="100" ry="9" fill="#000000" opacity="0.3" />
          <circle cx="158" cy="74" r="58" fill="#fbbf24" opacity="0.16" />
          <rect x="28" y="120" width="180" height="12" rx="2" fill="#334155" />
          <rect x="44" y="132" width="10" height="34" fill="#1e293b" />
          <rect x="182" y="132" width="10" height="34" fill="#1e293b" />
          <rect x="156" y="90" width="6" height="32" fill="#475569" />
          <path d="M148 70 l26 0 l-7 22 l-12 0 z" fill="#64748b" />
          <circle cx="161" cy="92" r="4" fill="#fde68a" />
          <rect x="70" y="110" width="44" height="11" rx="1" fill="#e2e8f0" />
          <path d="M66 120 q6 -40 28 -40 q16 0 20 24 l-3 16 z" fill="#7c3aed" />
          <circle cx="92" cy="74" r="12" fill="#f1c27d" />
          <path d="M80 73 a12 12 0 0 1 24 0 q-12 -10 -24 0 z" fill="#27313f" />
        </svg>
      </div>
    </div>
  )
}
