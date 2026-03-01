import { formatTime } from '../utils/strings';

export default function Timer({ remaining, total }) {
  const pct = total > 0 ? (remaining / total) * 100 : 100;
  const isLow = remaining <= 60;
  const isCritical = remaining <= 30;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-36 h-2.5 rounded-full overflow-hidden"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.04), rgba(0,0,0,0.08))',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: isCritical
              ? 'linear-gradient(90deg, #ef4444, #f87171)'
              : isLow
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, #14bd6e, #3dd68e)',
            boxShadow: isCritical
              ? '0 0 8px rgba(239,68,68,0.3)'
              : isLow
              ? '0 0 8px rgba(245,158,11,0.3)'
              : '0 0 8px rgba(20,189,110,0.2)',
          }}
        />
      </div>
      <span
        className={`font-mono text-lg font-bold tracking-tight ${
          isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700'
        }`}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
}
