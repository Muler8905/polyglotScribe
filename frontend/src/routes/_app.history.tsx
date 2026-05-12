import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Shell } from "@/components/Shell";
import { useServerFn } from "@tanstack/react-start";
import { listTranscriptions } from "@/serverFns/transcription.functions";
import { Search, Filter, Eye, Trash2 } from "lucide-react";
import s from "@/components/Dashboard.module.css"; // Reuse dashboard styles for cards/table

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "History — Polyglot Scribe" }] }),
  component: HistoryPage,
});

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  source_lang: string;
  target_lang: string;
  created_at: string;
}

function HistoryPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const list = useServerFn(listTranscriptions);

  useEffect(() => {
    list()
      .then((r: any) => setItems((r.items || []) as HistoryItem[]))
      .catch(console.error);
  }, [list]);

  const filteredItems = items.filter(it => {
    const matchesSearch = it.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || it.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Shell>
      <div className={s.container}>
        <header className={s.header}>
          <h1 className={s.welcomeTitle}>Transcription History</h1>
          <p className={s.welcomeSubtitle}>View and manage all your past transcriptions.</p>
        </header>

        <div className={s.glassCard}>
          <div className={s.sectionHeader} style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className={s.searchBar} style={{ maxWidth: '300px' }}>
              <input 
                type="text" 
                placeholder="Search history..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select 
                className={s.youtubeInput} 
                style={{ width: 'auto' }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="live">Live</option>
                <option value="file">File</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={s.activityTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Language</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td>{item.source_lang}/{item.target_lang || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{item.type}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to="/transcription/$id" params={{ id: item.id }} className={s.cardBtn} style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)' }}>
                      No history found. Try adjusting your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
