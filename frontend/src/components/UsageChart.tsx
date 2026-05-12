import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: "Oct 1", transcribed: 4000, translated: 2400 },
  { name: "Oct 3", transcribed: 7500, translated: 5000 },
  { name: "Oct 5", transcribed: 6200, translated: 4800 },
  { name: "Oct 7", transcribed: 9000, translated: 6000 },
  { name: "Oct 9", transcribed: 14500, translated: 8000 },
  { name: "Oct 11", transcribed: 11000, translated: 7000 },
  { name: "Oct 13", transcribed: 13000, translated: 8500 },
  { name: "Oct 15", transcribed: 14500, translated: 9800 },
];

export function UsageChart() {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTranscribed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.7 0.2 295)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.7 0.2 295)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTranslated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.6 0.2 280)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.6 0.2 280)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            stroke="var(--muted-foreground)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(v) => `${v / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ 
              background: "var(--card)", 
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              color: "var(--foreground)"
            }} 
          />
          <Area
            type="monotone"
            dataKey="transcribed"
            stroke="oklch(0.7 0.2 295)"
            fillOpacity={1}
            fill="url(#colorTranscribed)"
            strokeWidth={3}
          />
          <Area
            type="monotone"
            dataKey="translated"
            stroke="oklch(0.6 0.2 280)"
            fillOpacity={1}
            fill="url(#colorTranslated)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
