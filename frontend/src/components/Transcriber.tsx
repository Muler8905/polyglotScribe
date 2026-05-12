import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { toast } from "sonner";
import s from "./Transcriber.module.css";
import { LANGUAGES } from "@/lib/languages";
import { useServerFn } from "@tanstack/react-start";
import {
  getScribeToken,
  saveTranscription,
  synthesizeSpeech,
  translateAdhoc,
  translateTranscription,
  transcribeYouTube,
} from "@/serverFns/transcription.functions";
import { authedFetch } from "@/lib/auth-context";

type Tab = "live" | "file" | "youtube";

interface Props {
  onSaved?: () => void;
  initialTab?: Tab;
}

export function Transcriber({ onSaved, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab || "live");
  const { t } = useTranslation();

  return (
    <div>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === "live" ? s.active : ""}`} onClick={() => setTab("live")}>
          {t("transcriber.tabLive")}
        </button>
        <button className={`${s.tab} ${tab === "file" ? s.active : ""}`} onClick={() => setTab("file")}>
          {t("transcriber.tabFile")}
        </button>
        <button className={`${s.tab} ${tab === "youtube" ? s.active : ""}`} onClick={() => setTab("youtube")}>
          {t("transcriber.tabYouTube")}
        </button>
      </div>

      {tab === "live" && <LivePanel onSaved={onSaved} />}
      {tab === "file" && <FilePanel onSaved={onSaved} />}
      {tab === "youtube" && <YouTubePanel onSaved={onSaved} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared transcript + translation viewer                              */
/* ------------------------------------------------------------------ */

function ResultPanes(props: {
  transcript: string;
  partial?: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  onTranslate: () => void;
  translating: boolean;
  speaking: "src" | "tgt" | null;
  onSpeak: (which: "src" | "tgt") => void;
}) {
  const { transcript, partial, translation, sourceLang, targetLang, onTranslate, translating, speaking, onSpeak } = props;
  const { t } = useTranslation();

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => toast.success(t("transcriber.copied")));
  };
  const download = (txt: string, name: string) => {
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={s.transcriptGrid}>
      <div className={s.pane}>
        <div className={s.paneHeader}>
          <div className={s.paneTitle}>{t("transcriber.transcript")} ({labelOf(sourceLang)})</div>
          <div className={s.paneActions}>
            <button className={s.iconBtn} onClick={() => copy(transcript)} disabled={!transcript}>{t("transcriber.copy")}</button>
            <button className={s.iconBtn} onClick={() => download(transcript, "transcript.txt")} disabled={!transcript}>{t("transcriber.download")}</button>
            <button className={s.iconBtn} onClick={() => onSpeak("src")} disabled={!transcript || speaking === "src"}>
              {speaking === "src" ? t("transcriber.playing") : t("transcriber.play")}
            </button>
          </div>
        </div>
        <div className={s.transcriptText}>
          {!transcript && !partial && <span className={s.empty}>{t("transcriber.transcriptEmpty")}</span>}
          {transcript}
          {partial && <span className={s.partial}>{transcript ? " " : ""}{partial}</span>}
        </div>
      </div>

      <div className={s.pane}>
        <div className={s.paneHeader}>
          <div className={s.paneTitle}>{t("transcriber.translation")} ({labelOf(targetLang)})</div>
          <div className={s.paneActions}>
            <button className={s.iconBtn} onClick={onTranslate} disabled={translating || !transcript}>
              {translating ? t("transcriber.translating") : t("transcriber.translate")}
            </button>
            <button className={s.iconBtn} onClick={() => copy(translation)} disabled={!translation}>{t("transcriber.copy")}</button>
            <button className={s.iconBtn} onClick={() => onSpeak("tgt")} disabled={!translation || speaking === "tgt"}>
              {speaking === "tgt" ? t("transcriber.playing") : t("transcriber.play")}
            </button>
          </div>
        </div>
        <div className={s.transcriptText}>
          {translation || <span className={s.empty}>{t("transcriber.translationEmpty")}</span>}
        </div>
      </div>
    </div>
  );
}

function labelOf(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

function useTTS() {
  const [speaking, setSpeaking] = useState<"src" | "tgt" | null>(null);
  const synth = useServerFn(synthesizeSpeech);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = async (which: "src" | "tgt", text: string, lang: string) => {
    if (!text) return;
    try {
      setSpeaking(which);
      const { audioBase64 } = await synth({ data: { text, lang } });
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(null);
      audio.onerror = () => setSpeaking(null);
      await audio.play();
    } catch (e) {
      setSpeaking(null);
      toast.error(e instanceof Error ? e.message : t("transcriber.playbackFailed"));
    }
  };
  return { speaking, play };
}

/* ------------------------------------------------------------------ */
/* LIVE                                                                 */
/* ------------------------------------------------------------------ */

function LivePanel({ onSaved }: Props) {
  const { t } = useTranslation();
  const [sourceLang, setSourceLang] = useState("eng");
  const [targetLang, setTargetLang] = useState("amh");
  const [committed, setCommitted] = useState<string[]>([]);
  const [partial, setPartial] = useState("");
  const [translation, setTranslation] = useState("");
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const transcript = committed.join(" ").trim();
  const tts = useTTS();
  const getToken = useServerFn(getScribeToken);
  const translateFn = useServerFn(translateAdhoc);
  const saveFn = useServerFn(saveTranscription);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    languageCode: sourceLang,
    onPartialTranscript: (d: any) => {
      const t = typeof d === "string" ? d : d?.text ?? d?.transcript ?? "";
      setPartial(t);
    },
    onCommittedTranscript: (d: any) => {
      const t = (typeof d === "string" ? d : d?.text ?? d?.transcript ?? "").trim();
      if (t) setCommitted((prev) => [...prev, t]);
      setPartial("");
    },
  });

  // Fallback: mirror the hook's own state in case the callbacks above
  // don't fire (SDK shape differences across versions).
  const hookPartial = (scribe as any).partialTranscript as string | undefined;
  const hookCommitted = (scribe as any).committedTranscripts as
    | Array<{ id?: string; text?: string }>
    | undefined;
  useEffect(() => {
    if (typeof hookPartial === "string") setPartial(hookPartial);
  }, [hookPartial]);
  useEffect(() => {
    if (Array.isArray(hookCommitted) && hookCommitted.length) {
      const texts = hookCommitted.map((c) => (c?.text ?? "").trim()).filter(Boolean);
      if (texts.length) setCommitted(texts);
    }
  }, [hookCommitted]);

  const start = useCallback(async () => {
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      const { token } = await getToken();
      await scribe.connect({
        token,
        languageCode: sourceLang,
        sampleRate: 16000,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      toast.success(t("transcriber.listeningIn", { lang: labelOf(sourceLang) }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("transcriber.failStart"));
    } finally {
      setConnecting(false);
    }
  }, [getToken, scribe, sourceLang]);

  const stop = useCallback(async () => {
    await scribe.disconnect();
    toast.info(t("transcriber.recStopped"));
  }, [scribe, t]);

  const translate = async () => {
    if (!transcript) return;
    setTranslating(true);
    try {
      const { translation } = await translateFn({ data: { text: transcript, targetLang, sourceLang } });
      setTranslation(translation);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("transcriber.failTranslate"));
    } finally {
      setTranslating(false);
    }
  };

  const save = async () => {
    if (!transcript) return;
    setSaving(true);
    try {
      await saveFn({
        data: {
          type: "live",
          title: t("transcriber.liveRecordingTitle", { date: new Date().toLocaleString() }),
          transcript,
          sourceLang,
          targetLang: translation ? targetLang : undefined,
          translation: translation || undefined,
        },
      });
      toast.success(t("transcriber.savedToHistory"));
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("transcriber.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const clear = () => {
    setCommitted([]);
    setPartial("");
    setTranslation("");
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardTitle}>{t("transcriber.liveTitle")}</div>
        <div className={s.cardSubtitle}>{t("transcriber.liveDesc")}</div>
      </div>
      <div className={s.row}>
        <div className={s.field}>
          <label className={s.label}>{t("transcriber.spokenLang")}</label>
          <select className={s.select} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>{t("transcriber.translateTo")}</label>
          <select className={s.select} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={s.actions}>
        {!scribe.isConnected ? (
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={start} disabled={connecting}>
            {connecting ? t("transcriber.connecting") : t("transcriber.start")}
          </button>
        ) : (
          <button className={`${s.btn} ${s.btnDanger}`} onClick={stop}>
            {t("transcriber.stop")}
          </button>
        )}
        <button className={s.btn} onClick={clear} disabled={!transcript && !partial}>{t("transcriber.clear")}</button>
        <button className={s.btn} onClick={save} disabled={!transcript || saving}>
          {saving ? t("transcriber.saving") : t("transcriber.save")}
        </button>
        {scribe.isConnected && (
          <span className={s.statusLine}><span className={s.recordDot} />{t("transcriber.listening")}</span>
        )}
      </div>

      <ResultPanes
        transcript={transcript}
        partial={partial}
        translation={translation}
        sourceLang={sourceLang}
        targetLang={targetLang}
        onTranslate={translate}
        translating={translating}
        speaking={tts.speaking}
        onSpeak={(w) => tts.play(w, w === "src" ? transcript : translation, w === "src" ? sourceLang : targetLang)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FILE                                                                 */
/* ------------------------------------------------------------------ */

function FilePanel({ onSaved }: Props) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("eng");
  const [targetLang, setTargetLang] = useState("amh");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const tts = useTTS();
  const translateSaved = useServerFn(translateTranscription);
  const translateFn = useServerFn(translateAdhoc);

  const onFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setTranscript("");
    setTranslation("");
    setTranscriptionId(null);
  };

  const transcribe = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name);
      if (sourceLang) fd.append("language_code", sourceLang);
      const r = await authedFetch("/api/transcribe-file", { method: "POST", body: fd });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: r.statusText }));
        throw new Error(err.error || "Transcription failed");
      }
      const j = await r.json();
      setTranscript(j.text);
      setTranscriptionId(j.id);
      toast.success(t("transcriber.transcribedSaved"));
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("transcriber.fail"));
    } finally {
      setBusy(false);
    }
  };

  const translate = async () => {
    if (!transcript) return;
    setTranslating(true);
    try {
      if (transcriptionId) {
        const { translation } = await translateSaved({ data: { transcriptionId, targetLang } });
        setTranslation(translation);
      } else {
        const { translation } = await translateFn({ data: { text: transcript, targetLang, sourceLang } });
        setTranslation(translation);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("transcriber.failTranslate"));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardTitle}>{t("transcriber.fileTitle")}</div>
        <div className={s.cardSubtitle}>{t("transcriber.fileDesc")}</div>
      </div>

      <div
        className={`${s.dropZone} ${dragging ? s.dragging : ""}`}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <div>{t("transcriber.drop")}</div>
        {file && <div className={s.fileName}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</div>}
        <input
          ref={fileInput}
          className={s.fileInput}
          type="file"
          accept="audio/*,video/*"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className={s.row} style={{ marginTop: "1rem" }}>
        <div className={s.field}>
          <label className={s.label}>{t("transcriber.audioLang")}</label>
          <select className={s.select} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>{t("transcriber.translateTo")}</label>
          <select className={s.select} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
        </div>
      </div>

      <div className={s.actions}>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={transcribe} disabled={!file || busy}>
          {busy ? t("transcriber.transcribing") : t("transcriber.transcribe")}
        </button>
      </div>

      <ResultPanes
        transcript={transcript}
        translation={translation}
        sourceLang={sourceLang}
        targetLang={targetLang}
        onTranslate={translate}
        translating={translating}
        speaking={tts.speaking}
        onSpeak={(w) => tts.play(w, w === "src" ? transcript : translation, w === "src" ? sourceLang : targetLang)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* YOUTUBE                                                              */
/* ------------------------------------------------------------------ */

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

function YouTubePanel({ onSaved }: Props) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState("eng");
  const [targetLang, setTargetLang] = useState("amh");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");

  const tts = useTTS();
  const transcribeYT = useServerFn(transcribeYouTube);
  const translateFn = useServerFn(translateAdhoc);

  const transcribe = async () => {
    if (!url.trim()) {
      toast.error(t("transcriber.ytPromptUrl"));
      return;
    }

    setTranscribing(true);
    setTranscript("");
    setTranslation("");
    setVideoTitle("");
    setVideoId(null);

    try {
      const result = await transcribeYT({ data: { url: url.trim(), preferredLang: sourceLang } });
      setTranscript(result.text);
      setVideoTitle(result.title);
      setVideoId(extractYouTubeId(url.trim()));
      toast.success(t("transcriber.ytSuccess"));
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("transcriber.failTranscribe"));
    } finally {
      setTranscribing(false);
    }
  };

  const translate = async () => {
    if (!transcript) return;
    setTranslating(true);
    try {
      const { translation } = await translateFn({ data: { text: transcript, targetLang, sourceLang } });
      setTranslation(translation);
      toast.success(t("transcriber.translateSuccess"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("transcriber.failTranslate"));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardTitle}>{t("transcriber.youtubeTitle")}</div>
        <div className={s.cardSubtitle}>{t("transcriber.youtubeDesc")}</div>
      </div>

      <div className={s.row}>
        <div className={s.field} style={{ flex: 2 }}>
          <label className={s.label}>{t("transcriber.youtubeUrl")}</label>
          <input
            className={s.input}
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label className={s.label}>{t("transcriber.spokenLang")}</label>
          <select className={s.select} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>{t("transcriber.translateTo")}</label>
          <select className={s.select} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
        </div>
      </div>

      <div className={s.actions}>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={transcribe} disabled={!url.trim() || transcribing}>
          {transcribing ? t("transcriber.transcribing") : t("transcriber.transcribe")}
        </button>
      </div>

      {videoId && videoTitle && (
        <div className={s.videoCard}>
          <div className={s.videoFrame}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
              title={t("transcriber.ytIframeTitle")}
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className={s.videoHint}>
            📹 {videoTitle}
          </div>
        </div>
      )}

      <ResultPanes
        transcript={transcript}
        translation={translation}
        sourceLang={sourceLang}
        targetLang={targetLang}
        onTranslate={translate}
        translating={translating}
        speaking={tts.speaking}
        onSpeak={(w) => tts.play(w, w === "src" ? transcript : translation, w === "src" ? sourceLang : targetLang)}
      />
    </div>
  );
}
