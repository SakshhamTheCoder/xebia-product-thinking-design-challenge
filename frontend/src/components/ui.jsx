export function Button({ variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1';
  const variants = {
    primary:
      'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-emerald-300',
    secondary:
      'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 focus:ring-emerald-200',
    success:
      'bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-300',
    danger:
      'bg-red-600 text-white hover:bg-red-500 focus:ring-red-300',
    subtle:
      'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-200',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-emerald-800">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 placeholder:text-emerald-700/40 transition-shadow focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 placeholder:text-emerald-700/40 transition-shadow focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  const kinds = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${kinds[kind]}`}>
      {children}
    </div>
  );
}

export function Avatar({ src, name, size = 'md', ring = 'ring-emerald-100' }) {
  const sizes = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
  };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ${ring}`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-emerald-600 font-semibold text-white ring-2 ${ring}`}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-emerald-100 px-6 py-4">
          <h2 className="text-base font-semibold text-emerald-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-emerald-700/60 hover:bg-emerald-50 hover:text-emerald-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-emerald-700/70">
      Loading…
    </div>
  );
}

export function BrandMark({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-8 text-sm rounded-lg',
    md: 'h-11 w-11 text-lg rounded-xl',
  };
  return (
    <span
      className={`flex items-center justify-center bg-emerald-700 font-bold text-white ${sizes[size]} ${className}`}
    >
      L
    </span>
  );
}

export function XPBar({ progress }) {
  const pct = Math.max(0, Math.min(100, progress?.percent || 0));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-emerald-700/70">
        <span className="font-semibold text-emerald-800">Level {progress?.level}</span>
        <span>
          {progress?.xpIntoLevel} / {progress?.xpForNextLevel} XP to level{' '}
          {(progress?.level || 0) + 1}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LevelChip({ level }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
      ⚡ Lvl {level}
    </span>
  );
}

export function StreakPill({ days, onDark = false }) {
  if (onDark) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-white/25">
        🔥 {days}-day streak
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        days > 0
          ? 'bg-amber-50 text-amber-700 ring-amber-200'
          : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      }`}
    >
      🔥 {days}-day streak
    </span>
  );
}

export function Badge({ badge }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl ring-1 ring-amber-200"
        title={badge.description}
      >
        {badge.icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-emerald-900">{badge.name}</div>
        <div className="truncate text-xs text-emerald-700/70">{badge.description}</div>
      </div>
    </div>
  );
}

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  intermediate: 'bg-amber-50 text-amber-700 ring-amber-200',
  advanced: 'bg-red-50 text-red-700 ring-red-200',
};

export function DifficultyBadge({ difficulty }) {
  const cls = DIFFICULTY_STYLES[difficulty] || 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${cls}`}
    >
      {difficulty}
    </span>
  );
}

export function TrackTag({ track }) {
  return (
    <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      {track}
    </span>
  );
}

const ATTEMPT_STYLES = {
  in_progress: { label: 'In progress', cls: 'bg-teal-50 text-teal-700 ring-teal-200' },
  submitted: { label: 'Awaiting review', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  approved: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  changes_requested: {
    label: 'Changes requested',
    cls: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
};

export function AttemptStatusBadge({ status }) {
  const s = ATTEMPT_STYLES[status] || {
    label: status,
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
