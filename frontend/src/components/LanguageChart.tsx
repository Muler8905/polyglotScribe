import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const COLORS = ["oklch(0.6 0.2 280)", "oklch(0.7 0.2 295)", "oklch(0.5 0.2 260)", "oklch(0.8 0.1 240)"];

const getLangKey = (name: string) => {
  switch (name.toLowerCase()) {
    case 'english': return 'common.langEng';
    case 'amharic': return 'common.langAmh';
    case 'afaan oromo': return 'common.langOrm';
    case 'somali': return 'common.langSom';
    default: return name;
  }
};

export function LanguageChart({ data: propData }: { data?: any[] }) {
  const { t } = useTranslation();
  
  const chartData = (propData || [
    { name: "common.langEng", value: 45 },
    { name: "common.langAmh", value: 30 },
    { name: "common.langOrm", value: 15 },
    { name: "common.langSom", value: 10 },
  ]).map((item, idx) => ({
    ...item,
    color: COLORS[idx % COLORS.length],
    langKey: item.name.includes('.') ? item.name : getLangKey(item.name)
  }));
  
  return (
    <div style={{ width: "100%", height: 200, display: "flex", alignItems: "center" }}>
      <ResponsiveContainer width="60%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {chartData.map((item) => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
            <span style={{ color: "var(--muted-foreground)" }}>{t(item.langKey)}</span>
            <span style={{ color: "var(--foreground)", fontWeight: 600, marginLeft: "auto" }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
