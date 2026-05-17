import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import s from "@/components/Transcriber.module.css";
import { LANGUAGES } from "@/lib/languages";
import {
  deleteTranscription,
  getTranscription,
  synthesizeSpeech,
  translateTranscription,
} from "@/serverFns/transcription.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { t } = useTranslation();
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
    await del({ data: { id: item.id } });
    toast.success(t("transcription.deleted"));
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
      toast.error(e instanceof Error ? e.message : t("transcriber.playbackFailed"));
    }
  };

  const copy = (t_str: string) => navigator.clipboard.writeText(t_str).then(() => toast.success(t("transcriber.copied")));
  const download = (t_str: string, name: string) => {
    const blob = new Blob([t_str], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {!item ? (
        <div className={s.empty}>{t("transcription.loading")}</div>
      ) : (
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitle}>{item.title}</div>
            <div className={s.cardSubtitle}>
              {item.type.toUpperCase()} · {new Date(item.created_at).toLocaleString()}
              {item.source_url && (
                <> · <a href={item.source_url} target="_blank" rel="noreferrer">{t("transcription.openSource")}</a></>
              )}
            </div>
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label}>{t("transcription.translateTo")}</label>
              <select className={s.select} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
              </select>
            </div>
          </div>
          <div className={s.actions}>
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={onTranslate} disabled={translating}>
              {translating ? t("transcription.translating") : t("transcription.translate")}
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className={`${s.btn} ${s.btnDanger}`}>{t("transcription.delete")}</button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("transcription.confirmDelete")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this transcription? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className={s.transcriptGrid}>
            <div className={s.pane}>
              <div className={s.paneHeader}>
                <div className={s.paneTitle}>{t("transcription.transcript")} ({item.source_lang ?? "auto"})</div>
                <div className={s.paneActions}>
                  <button className={s.iconBtn} onClick={() => copy(item.transcript)}>{t("transcription.copy")}</button>
                  <button className={s.iconBtn} onClick={() => download(item.transcript, `${item.title}.txt`)}>{t("transcription.download")}</button>
                  <button className={s.iconBtn} onClick={() => speak("src")} disabled={speaking === "src"}>
                    {speaking === "src" ? t("transcription.playing") : t("transcription.play")}
                  </button>
                </div>
              </div>
              <div className={s.transcriptText}>{item.transcript}</div>
            </div>
            <div className={s.pane}>
              <div className={s.paneHeader}>
                <div className={s.paneTitle}>{t("transcription.translation")} ({targetLang})</div>
                <div className={s.paneActions}>
                  <button className={s.iconBtn} onClick={() => item.translation && copy(item.translation)} disabled={!item.translation}>{t("transcription.copy")}</button>
                  <button className={s.iconBtn} onClick={() => speak("tgt")} disabled={!item.translation || speaking === "tgt"}>
                    {speaking === "tgt" ? t("transcription.playing") : t("transcription.play")}
                  </button>
                </div>
              </div>
              <div className={s.transcriptText}>
                {item.translation || <span className={s.empty}>{t("transcription.noTranslation")}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
