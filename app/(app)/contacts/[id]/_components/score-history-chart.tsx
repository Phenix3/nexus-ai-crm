"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ScorePoint {
  date: string;
  score: number;
}

interface ScoreHistoryChartProps {
  data: ScorePoint[];
  currentScore: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md dark:bg-zinc-800 dark:border-zinc-700">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Score: {payload[0].value}
      </p>
    </div>
  );
}

export function ScoreHistoryChart({ data, currentScore }: ScoreHistoryChartProps) {
  const scoreColor = currentScore >= 70 ? "#22c55e" : currentScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Score history</h3>
        </div>
        <span className="text-lg font-bold tabular-nums" style={{ color: scoreColor }}>
          {currentScore}
          <span className="text-xs font-normal text-zinc-400 ml-0.5">/ 100</span>
        </span>
      </div>

      {data.length < 2 ? (
        <div className="flex h-20 items-center justify-center">
          <p className="text-xs text-zinc-400">Not enough data to display chart</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              tickLine={false}
              axisLine={false}
              tickCount={3}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={scoreColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: scoreColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
