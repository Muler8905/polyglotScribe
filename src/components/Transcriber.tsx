import { useCallback, useEffect, useRef, useState } from "react";
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
} from "@/server/transcription.functions";
import { authedFetch } from "@/lib/auth-context";

type Tab = "live" | "file" | "youtube";

interface Props {
  onSaved?: () => void;
}

export function Transcriber({ onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <div>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === "live" ? s.active : ""}`} onClick={() => setTab("live")}>
          🎙️ Live
        </button>
        <button className={`${s.tab} ${tab === "file" ? s.active : ""}`} onClick={() => setTab("file")}>
          📁 Audio File
        </button>
        <button className={`${s.tab} ${tab === "youtube" ? s.active : ""}`} onClick={() => setTab("youtube")}>
          ▶️ YouTube
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

  const copy = (t: string) => {
    navigator.clipboard.writeText(t).then(() => toast.success("Copied"));
  };
  const download = (t: string, name: string) => {
    const blob = new Blob([t], { type: "text/plain" });
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
          <div className={s.paneTitle}>Transcript ({labelOf(sourceLang)})</div>
          <div className={s.paneActions}>
            <button className={s.iconBtn} onClick={() => copy(transcript)} disabled={!transcript}>Copy</button>
            <button className={s.iconBtn} onClick={() => download(transcript, "transcript.txt")} disabled={!transcript}>Download</button>
            <button className={s.iconBtn} onClick={() => onSpeak("src")} disabled={!transcript || speaking === "src"}>
              {speaking === "src" ? "Playing…" : "🔊 Play"}
            </button>
          </div>
        </div>
        <div className={s.transcriptText}>
          {transcript || <span className={s.empty}>Transcript will appear here.</span>}
          {partial && <span className={s.partial}> {partial}</span>}
        </div>
      </div>

      <div className={s.pane}>
        <div className={s.paneHeader}>
          <div className={s.paneTitle}>Translation ({labelOf(targetLang)})</div>
          <div className={s.paneActions}>
            <button className={s.iconBtn} onClick={onTranslate} disabled={translating || !transcript}>
              {translating ? "Translating…" : "Translate"}
            </button>
            <button className={s.iconBtn} onClick={() => copy(translation)} disabled={!translation}>Copy</button>
            <button className={s.iconBtn} onClick={() => onSpeak("tgt")} disabled={!translation || speaking === "tgt"}>
              {speaking === "tgt" ? "Playing…" : "🔊 Play"}
            </button>
          </div>
        </div>
        <div className={s.transcriptText}>
          {translation || <span className={s.empty}>Click Translate to see the translation.</span>}
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
      toast.error(e instanceof Error ? e.message : "Playback failed");
    }
  };
  return { speaking, play };
}

/* ------------------------------------------------------------------ */
/* LIVE                                                                 */
/* ------------------------------------------------------------------ */

function LivePanel({ onSaved }: Props) {
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
    onPartialTranscript: (d: { text: string }) => setPartial(d?.text ?? ""),
    onCommittedTranscript: (d: { text: string }) => {
      const t = (d?.text ?? "").trim();
      if (t) setCommitted((prev) => [...prev, t]);
      setPartial("");
    },
  });

  const start = useCallback(async () => {
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { token } = await getToken({});
      await scribe.connect({
        token,
        microphone: { echoCancellation: true, noiseSuppression: true },
      });
      toast.success("Recording started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setConnecting(false);
    }
  }, [getToken, scribe]);

  const stop = useCallback(async () => {
    await scribe.disconnect();
    toast.info("Recording stopped");
  }, [scribe]);

  const translate = async () => {
    if (!transcript) return;
    setTranslating(true);
    try {
      const { translation } = await translateFn({ data: { text: transcript, targetLang, sourceLang } });
      setTranslation(translation);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
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
          title: `Live recording — ${new Date().toLocaleString()}`,
          transcript,
          sourceLang,
          targetLang: translation ? targetLang : undefined,
          translation: translation || undefined,
        },
      });
      toast.success("Saved to history");
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
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
        <div className={s.cardTitle}>Live Transcription</div>
        <div className={s.cardSubtitle}>Speak into your microphone — words appear in real time.</div>
      </div>
      <div className={s.row}>
        <div className={s.field}>
          <label className={s.label}>Spoken language</label>
          <select className={s.select} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>Translate to</label>
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
            {connecting ? "Connecting…" : "🎙️ Start recording"}
          </button>
        ) : (
          <button className={`${s.btn} ${s.btnDanger}`} onClick={stop}>
            ⏹ Stop
          </button>
        )}
        <button className={s.btn} onClick={clear} disabled={!transcript && !partial}>Clear</button>
        <button className={s.btn} onClick={save} disabled={!transcript || saving}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
        {scribe.isConnected && (
          <span className={s.statusLine}><span className={s.recordDot} />Listening…</span>
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
      toast.success("Transcribed and saved");
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
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
      toast.error(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardTitle}>Transcribe Audio File</div>
        <div className={s.cardSubtitle}>Upload an MP3, WAV, M4A, or video file.</div>
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
        <div>📤 Drop file or click to browse</div>
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
          <label className={s.label}>Audio language</label>
          <select className={s.select} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>Translate to</label>
          <select className={s.select} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
        </div>
      </div>

      <div className={s.actions}>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={transcribe} disabled={!file || busy}>
          {busy ? "Transcribing…" : "Transcribe"}
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

function YouTubePanel({ onSaved }: Props) {
  const [url, setUrl] = useState("");
  const [targetLang, setTargetLang] = useState("amh");
  const [preferredCaption, setPreferredCaption] = useState("en");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [detectedLang, setDetectedLang] = useState("eng");
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [translating, setTranslating] = useState(false);
  const tts = useTTS();
  const ytFn = useServerFn(transcribeYouTube);
  const translateSaved = useServerFn(translateTranscription);

  const fetchCaptions = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const r = await ytFn({ data: { url, preferredLang: preferredCaption } });
      setTranscript(r.text);
      setTranscriptionId(r.id);
      setDetectedLang(r.languageCode || "eng");
      toast.success(`Captions loaded (${r.languageCode})`);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch captions");
    } finally {
      setBusy(false);
    }
  };

  const translate = async () => {
    if (!transcriptionId) return;
    setTranslating(true);
    try {
      const { translation } = await translateSaved({ data: { transcriptionId, targetLang } });
      setTranslation(translation);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardTitle}>YouTube Transcription</div>
        <div className={s.cardSubtitle}>Paste a YouTube URL — we fetch its captions instantly.</div>
      </div>
      <div className={s.row}>
        <div className={s.field} style={{ flex: 2 }}>
          <label className={s.label}>YouTube URL</label>
          <input
            className={s.input}
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label className={s.label}>Caption language</label>
          <select className={s.select} value={preferredCaption} onChange={(e) => setPreferredCaption(e.target.value)}>
            <option value="en">English</option>
            <option value="am">Amharic</option>
            <option value="om">Afaan Oromo</option>
            <option value="so">Somali</option>
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>Translate to</label>
          <select className={s.select} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
          </select>
        </div>
      </div>
      <div className={s.actions}>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={fetchCaptions} disabled={!url.trim() || busy}>
          {busy ? "Fetching…" : "Fetch Captions"}
        </button>
      </div>

      <ResultPanes
        transcript={transcript}
        translation={translation}
        sourceLang={detectedLang}
        targetLang={targetLang}
        onTranslate={translate}
        translating={translating}
        speaking={tts.speaking}
        onSpeak={(w) => tts.play(w, w === "src" ? transcript : translation, w === "src" ? detectedLang : targetLang)}
      />
    </div>
  );
}
