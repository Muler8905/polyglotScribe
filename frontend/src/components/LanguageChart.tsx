import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const data = [
  { name: "English", value: 45, color: "oklch(0.6 0.2 280)" },
  { name: "Amharic", value: 30, color: "oklch(0.7 0.2 295)" },
  { name: "Afaan Oromo", value: 15, color: "oklch(0.5 0.2 260)" },
  { name: "Somali", value: 10, color: "oklch(0.8 0.1 240)" },
];

export function LanguageChart() {
  return (
    <div style={{ width: "100%", height: 200, display: "flex", alignItems: "center" }}>
      <ResponsiveContainer width="60%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {data.map((item) => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
            <span style={{ color: "var(--muted-foreground)" }}>{item.name}</span>
            <span style={{ color: "white", fontWeight: 600, marginLeft: "auto" }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
