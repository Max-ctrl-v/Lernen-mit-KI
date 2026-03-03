import { useMemo, memo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default memo(function ScoreChart({ sessions }) {
  const data = useMemo(
    () =>
      [...sessions]
        .reverse()
        .map((s, i) => ({
          nr: i + 1,
          score: s.score ?? 0,
          date: new Date(s.createdAt).toLocaleDateString('de-AT', {
            day: '2-digit',
            month: '2-digit',
          }),
        })),
    [sessions]
  );

  return (
    <div className="surface-elevated p-6">
      <h3 className="font-display text-xl text-gray-800 tracking-heading mb-4">Punkteverlauf</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14bd6e" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#14bd6e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#e2e6eb' }} />
          <YAxis domain={[0, 25]} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#e2e6eb' }} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e6eb',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '13px',
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#14bd6e"
            strokeWidth={2.5}
            fill="url(#scoreGradient)"
            dot={{ fill: '#fff', stroke: '#14bd6e', strokeWidth: 2.5, r: 4 }}
            activeDot={{ fill: '#14bd6e', stroke: '#fff', strokeWidth: 2, r: 6 }}
            name="Punkte"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
