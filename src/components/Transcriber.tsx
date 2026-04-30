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
    languageCode: sourceLang,
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
      toast.success(`Listening in ${labelOf(sourceLang)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setConnecting(false);
    }
  }, [getToken, scribe, sourceLang]);

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
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
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
    onPartialTranscript: (d: { text: string }) => setPartial(d?.text ?? ""),
    onCommittedTranscript: (d: { text: string }) => {
      const t = (d?.text ?? "").trim();
      if (t) setCommitted((prev) => [...prev, t]);
      setPartial("");
    },
  });

  const loadVideo = () => {
    const id = extractYouTubeId(url.trim());
    if (!id) {
      toast.error("Invalid YouTube URL");
      return;
    }
    setVideoId(id);
    setCommitted([]);
    setPartial("");
    setTranslation("");
    toast.success("Video loaded — press ▶ on the player, then Start Listening");
  };

  const startListening = async () => {
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
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
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      toast.success(`Listening to video audio in ${labelOf(sourceLang)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setConnecting(false);
    }
  };

  const stopListening = async () => {
    await scribe.disconnect();
    toast.info("Stopped listening");
  };

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
    if (!transcript || !videoId) return;
    setSaving(true);
    try {
      await saveFn({
        data: {
          type: "youtube",
          title: `YouTube — ${videoId}`,
          transcript,
          sourceLang,
          targetLang: translation ? targetLang : undefined,
          translation: translation || undefined,
          sourceUrl: `https://youtu.be/${videoId}`,
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

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardTitle}>YouTube Live Transcription</div>
        <div className={s.cardSubtitle}>
          Paste a URL → click Transcribe → press play on the video. Words appear in real time as the video speaks.
        </div>
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
          <label className={s.label}>Spoken language</label>
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
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={loadVideo} disabled={!url.trim()}>
          ▶ Transcribe
        </button>
        {videoId && !scribe.isConnected && (
          <button className={s.btn} onClick={startListening} disabled={connecting}>
            {connecting ? "Connecting…" : "🎙️ Start Listening"}
          </button>
        )}
        {scribe.isConnected && (
          <button className={`${s.btn} ${s.btnDanger}`} onClick={stopListening}>⏹ Stop</button>
        )}
        <button className={s.btn} onClick={save} disabled={!transcript || saving}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
        {scribe.isConnected && (
          <span className={s.statusLine}><span className={s.recordDot} />Listening…</span>
        )}
      </div>

      {videoId && (
        <div className={s.videoCard}>
          <div className={s.videoFrame}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
              title="YouTube video"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className={s.videoHint}>
            💡 Play the video out loud (speakers) so the microphone can hear it. For best results, use a quiet room.
          </div>
        </div>
      )}

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
