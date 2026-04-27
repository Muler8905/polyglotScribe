import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import s from "@/components/Transcriber.module.css";
import { LANGUAGES } from "@/lib/languages";
import {
  deleteTranscription,
  getTranscription,
  synthesizeSpeech,
  translateTranscription,
} from "@/server/transcription.functions";

export const Route = createFileRoute("/_app/transcription/$id")({
  head: () => ({ meta: [{ title: "Transcription — Polyglot Scribe" }] }),
  component: TranscriptionDetail,
});

interface Item {
  id: string;
  type: "live" | "file" | "youtube";
  title: string;
  source_url: string | null;
  source_lang: string | null;
  target_lang: string | null;
  transcript: string;
  translation: string | null;
  created_at: string;
}

function TranscriptionDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const get = useServerFn(getTranscription);
  const trans = useServerFn(translateTranscription);
  const del = useServerFn(deleteTranscription);
  const synth = useServerFn(synthesizeSpeech);

  const [item, setItem] = useState<Item | null>(null);
  const [targetLang, setTargetLang] = useState("amh");
  const [translating, setTranslating] = useState(false);
  const [speaking, setSpeaking] = useState<"src" | "tgt" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setItem(null);
    get({ data: { id } }).then((r) => {
      const i = r.item as Item;
      setItem(i);
      if (i.target_lang) setTargetLang(i.target_lang);
    }).catch((e) => toast.error(e.message));
  }, [id, get]);

  const onTranslate = async () => {
    if (!item) return;
    setTranslating(true);
    try {
      const { translation } = await trans({ data: { transcriptionId: item.id, targetLang } });
      setItem({ ...item, translation, target_lang: targetLang });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  const onDelete = async () => {
    if (!item) return;
    if (!confirm("Delete this transcription permanently?")) return;
    await del({ data: { id: item.id } });
    toast.success("Deleted");
    setRefreshKey((k) => k + 1);
    nav({ to: "/dashboard" });
  };

  const speak = async (which: "src" | "tgt") => {
    if (!item) return;
    const text = which === "src" ? item.transcript : item.translation ?? "";
    const lang = which === "src" ? (item.source_lang ?? "eng") : targetLang;
    if (!text) return;
    try {
      setSpeaking(which);
      const { audioBase64 } = await synth({ data: { text, lang } });
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audio.onended = () => setSpeaking(null);
      audio.onerror = () => setSpeaking(null);
      await audio.play();
    } catch (e) {
      setSpeaking(null);
      toast.error(e instanceof Error ? e.message : "Playback failed");
    }
  };

  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => toast.success("Copied"));
  const download = (t: string, name: string) => {
    const blob = new Blob([t], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell activeId={id} refreshKey={refreshKey}>
      {!item ? (
        <div className={s.empty}>Loading…</div>
      ) : (
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitle}>{item.title}</div>
            <div className={s.cardSubtitle}>
              {item.type.toUpperCase()} · {new Date(item.created_at).toLocaleString()}
              {item.source_url && (
                <> · <a href={item.source_url} target="_blank" rel="noreferrer">Open source</a></>
              )}
            </div>
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label}>Translate to</label>
              <select className={s.select} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
              </select>
            </div>
          </div>
          <div className={s.actions}>
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={onTranslate} disabled={translating}>
              {translating ? "Translating…" : "Translate"}
            </button>
            <button className={`${s.btn} ${s.btnDanger}`} onClick={onDelete}>🗑 Delete</button>
          </div>

          <div className={s.transcriptGrid}>
            <div className={s.pane}>
              <div className={s.paneHeader}>
                <div className={s.paneTitle}>Transcript ({item.source_lang ?? "auto"})</div>
                <div className={s.paneActions}>
                  <button className={s.iconBtn} onClick={() => copy(item.transcript)}>Copy</button>
                  <button className={s.iconBtn} onClick={() => download(item.transcript, `${item.title}.txt`)}>Download</button>
                  <button className={s.iconBtn} onClick={() => speak("src")} disabled={speaking === "src"}>
                    {speaking === "src" ? "Playing…" : "🔊 Play"}
                  </button>
                </div>
              </div>
              <div className={s.transcriptText}>{item.transcript}</div>
            </div>
            <div className={s.pane}>
              <div className={s.paneHeader}>
                <div className={s.paneTitle}>Translation ({targetLang})</div>
                <div className={s.paneActions}>
                  <button className={s.iconBtn} onClick={() => item.translation && copy(item.translation)} disabled={!item.translation}>Copy</button>
                  <button className={s.iconBtn} onClick={() => speak("tgt")} disabled={!item.translation || speaking === "tgt"}>
                    {speaking === "tgt" ? "Playing…" : "🔊 Play"}
                  </button>
                </div>
              </div>
              <div className={s.transcriptText}>
                {item.translation || <span className={s.empty}>No translation yet — pick a language and click Translate.</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
