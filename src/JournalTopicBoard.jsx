import { useState, useRef } from "react";
import deskBgDesktop from "./assets/journal-desk-bg.jpg";
import deskBgMobile from "./assets/journal-desk-bg-mobile.jpg";

const STAR_POSITIONS = [
  { top: "8%", left: "60%", size: 2, delay: "0.4s" },
  { top: "10%", left: "68%", size: 2, delay: "1s" },
  { top: "12%", left: "75%", size: 2, delay: "0.2s" },
  { top: "16%", left: "82%", size: 2, delay: "1.4s" },
  { top: "18%", left: "70%", size: 2, delay: "0.6s" },
  { top: "20%", left: "78%", size: 2, delay: "1.1s" },
  { top: "22%", left: "86%", size: 2, delay: "0.8s" },
];

const SECTIONS = [
  { id: "text", title: "فایل‌های متنی" },
  { id: "audio", title: "فایل‌های صوتی / ویس" },
  { id: "media", title: "گالری تصویر و ویدئو" },
  { id: "notes", title: "نوت‌های تحقیق" },
];

// ⭐ انیمیشن ستاره‌ها
const starAnimationStyle = `
@keyframes star-twinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}
.animate-star-twinkle {
  animation: star-twinkle 1.6s infinite ease-in-out;
}
`;

export default function JournalTopicBoard({
  isFa,
  username,
  topicId,
  topicTitle,
  onBack = () => {},
  onExit = () => {},
}) {
  const [activeId, setActiveId] = useState("text");

  // ✅ اسم تاپیک از props می‌آید، اگر نبود پیش‌فرض
  const topicName =
    (topicTitle && topicTitle.trim()) ||
    (isFa ? "تاپیک انتخاب‌شده" : "Selected topic");

  const [filesBySection, setFilesBySection] = useState({
    text: [],
    audio: [],
    media: [],
  });

  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notesList, setNotesList] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteText, setEditingNoteText] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleAddFiles = (sectionId, fileList) => {
    const newFiles = Array.from(fileList || []);
    if (!newFiles.length) return;

    const mapped = newFiles.map((f) => {
      const id = `${sectionId}-${Date.now()}-${Math.random()}`;
      const base = {
        id,
        name: f.name,
        size: f.size,
        type: f.type,
        createdAt: new Date().toISOString(),
        recorded: false,
        fileObject: f,
      };

      if (sectionId === "media" && f.type?.startsWith("image/")) {
        return {
          ...base,
          previewUrl: URL.createObjectURL(f),
        };
      }

      return base;
    });

    setFilesBySection((prev) => ({
      ...prev,
      [sectionId]: [...prev[sectionId], ...mapped],
    }));
  };

  const handleDrop = (e, sectionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files?.length) {
      handleAddFiles(sectionId, e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const name = `voice-${new Date().toLocaleTimeString("fa-IR")}.webm`;
        const file = new File([blob], name, { type: blob.type });

        const fakeFile = {
          id: `audio-recorded-${Date.now()}`,
          name,
          size: blob.size,
          type: blob.type,
          createdAt: new Date().toISOString(),
          recorded: true,
          fileObject: file,
        };

        setFilesBySection((prev) => ({
          ...prev,
          audio: [...prev.audio, fakeFile],
        }));
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert(
        "دسترسی به میکروفن ممکن نشد. لطفاً اجازه دسترسی را در مرورگر/گوشی فعال کن."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSaveNote = () => {
    if (!noteText.trim() && !noteTitle.trim()) return;

    setNotesList((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: noteTitle.trim() || "نوت بدون عنوان",
        content: noteText.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setNoteTitle("");
    setNoteText("");
  };

  const handleDeleteNote = (id) => {
    setNotesList((prev) => prev.filter((n) => n.id !== id));
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setEditingNoteText("");
      setEditingNoteTitle("");
    }
  };

  const handleStartEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title || "");
    setEditingNoteText(note.content || "");
  };

  const handleSaveEditNote = () => {
    if (!editingNoteId) return;
    setNotesList((prev) =>
      prev.map((n) =>
        n.id === editingNoteId
          ? {
              ...n,
              title: editingNoteTitle.trim() || n.title,
              content: editingNoteText.trim() || n.content,
            }
          : n
      )
    );
    setEditingNoteId(null);
    setEditingNoteText("");
    setEditingNoteTitle("");
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
    setEditingNoteTitle("");
  };

  const getFileIcon = (file, sectionId) => {
    if (sectionId === "audio") {
      return "🎧";
    }
    if (sectionId === "media") {
      if (file.type?.startsWith("video/")) return "🎬";
      return "📦";
    }
    if (file.name?.toLowerCase().endsWith(".pdf")) return "📕";
    if (
      file.name?.toLowerCase().endsWith(".doc") ||
      file.name?.toLowerCase().endsWith(".docx")
    )
      return "📘";
    if (
      file.name?.toLowerCase().endsWith(".ppt") ||
      file.name?.toLowerCase().endsWith(".pptx")
    )
      return "📙";
    return "📄";
  };

  const handleFileRename = (sectionId, file) => {
    const currentName = file.name || "";
    const newName = window.prompt("نام جدید فایل:", currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;

    setFilesBySection((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId].map((f) =>
        f.id === file.id ? { ...f, name: newName.trim() } : f
      ),
    }));
  };

  const renderFilesGrid = (sectionId) => {
    const items = filesBySection[sectionId] || [];
    if (!items.length) {
      return (
        <p className="text-[10px] md:text-xs text-slate-500 mt-1">
          فعلاً فایلی در این بخش نیست.
        </p>
      );
    }

    return (
      <div className="mt-2 max-h-36 md:max-h-40 overflow-auto pr-1 pb-2 scroll-area">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-3 md:gap-x-4 md:gap-y-4">
          {items.map((f) => (
            <div
              key={f.id}
              className="flex flex-col items-center justify-start text-center cursor-default select-none"
              onContextMenu={(e) => {
                e.preventDefault();
                handleFileRename(sectionId, f);
              }}
              onDoubleClick={() => handleFileRename(sectionId, f)}
              title="برای تغییر نام، کلیک راست یا دابل‌کلیک کن"
            >
              <div
                className={
                  "flex items-center justify-center w-12 h-12 md:w-14 md:h-14 border border-slate-600/70 shadow-sm overflow-hidden " +
                  (sectionId === "audio"
                    ? "rounded-full bg-slate-900/80"
                    : "rounded-[16px] bg-slate-900/70")
                }
              >
                {sectionId === "media" &&
                f.previewUrl &&
                f.type?.startsWith("image/") ? (
                  <img
                    src={f.previewUrl}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg md:text-xl">
                    {getFileIcon(f, sectionId)}
                  </span>
                )}
              </div>
              <div className="mt-1.5 max-w-[72px] md:max-w-[90px]">
                <p className="text-[9px] md:text-[10px] text-slate-100 truncate">
                  {f.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPanel = () => {
    if (activeId === "text") {
      return (
        <>
          <h2 className="text-sm md:text-base font-semibold mb-1">
            فایل‌های متنی
          </h2>

          <div
            onDrop={(e) => handleDrop(e, "text")}
            onDragOver={handleDragOver}
            className="mt-1 rounded-xl border border-sky-500/60 border-dashed bg-sky-500/5 hover:bg-sky-500/10 transition px-3 py-3 flex flex-col gap-2 items-center justify-center text-center"
          >
            <p className="text-[10px] md:text-xs text-slate-200">
              فایل‌های متنی را اینجا بکش و رها کن
            </p>
            <label className="inline-flex items-center gap-2 rounded-full border border-sky-400/70 bg-sky-400/15 px-3 py-1.5 text-[10px] md:text-xs cursor-pointer hover:bg-sky-400/25 transition">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf"
                className="hidden"
                onChange={(e) => handleAddFiles("text", e.target.files)}
              />
              <span>انتخاب فایل متنی</span>
            </label>
          </div>

          {renderFilesGrid("text")}
        </>
      );
    }

    if (activeId === "audio") {
      return (
        <>
          <h2 className="text-sm md:text-base font-semibold mb-1">
            فایل‌های صوتی / ویس
          </h2>

          <div
            onDrop={(e) => handleDrop(e, "audio")}
            onDragOver={handleDragOver}
            className="mt-1 rounded-xl border border-emerald-500/60 border-dashed bg-emerald-500/5 hover:bg-emerald-500/10 transition px-3 py-3 flex flex.col gap-2 items-center justify-center text-center"
          >
            <p className="text-[10px] md:text-xs text-slate-200">
              فایل‌های صوتی را اینجا بکش و رها کن
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <label className="inline-flex items-center gap-2 rounded-full border border-emerald-400/70 bg-emerald-400/15 px-3 py-1.5 text-[10px] md:text-xs cursor-pointer hover:bg-emerald-400/25 transition">
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleAddFiles("audio", e.target.files)}
                />
                <span>آپلود فایل صوتی</span>
              </label>

              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] md:text-xs transition ${
                  isRecording
                    ? "border-red-400 bg-red-500/20 text-red-100"
                    : "border-red-400/70 bg-red-400/10 text-red-100 hover:bg-red-400/20"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                {isRecording ? "توقف ضبط" : "شروع ضبط ویس"}
              </button>
            </div>
          </div>

          {renderFilesGrid("audio")}
        </>
      );
    }

    if (activeId === "media") {
      return (
        <>
          <h2 className="text-sm md:text-base font-semibold mb-1">
            گالری تصویر و ویدئو
          </h2>

          <div
            onDrop={(e) => handleDrop(e, "media")}
            onDragOver={handleDragOver}
            className="mt-1 rounded-xl border border-fuchsia-500/70 border-dashed bg-fuchsia-500/5 hover:bg-fuchsia-500/10 transition px-3 py-3 flex flex-col gap-2 items-center justify-center text-center"
          >
            <p className="text-[10px] md:text-xs text-slate-200">
              عکس‌ها و ویدئوها را اینجا بکش و رها کن
            </p>
            <label className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/70 bg-fuchsia-400/15 px-3 py-1.5 text-[10px] md:text-xs cursor-pointer hover:bg-fuchsia-400/25 transition">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleAddFiles("media", e.target.files)}
              />
              <span>آپلود عکس / ویدئو</span>
            </label>
          </div>

          {renderFilesGrid("media")}
        </>
      );
    }

    if (activeId === "notes") {
      return (
        <>
          <h2 className="text-sm md:text-base font-semibold mb-1">
            نوت‌های تحقیق
          </h2>
          <p className="text-[10px] md:text-xs text-slate-300 mb-1.5">
            اینجا می‌تونی متن، ایده‌ها و لینک‌های مهم (مقاله، ویدئو، سایت‌ها)
            رو برای این تاپیک ذخیره کنی.
          </p>

          {/* 🔹 کل پنل نوت‌ها اسکرول‌بار دارد */}
          <div className="flex-1 min-h-0 scroll-area overflow-auto pr-1">
            <div className="flex flex-col gap-2 pb-3">
              {/* عنوان نوت */}
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="عنوان نوت (مثلاً: منابع اصلی تحقیق)"
                className="w-full rounded-xl bg-slate-900/70 border border-slate-600/70 px-3 py-1.5 text-[11px] md:text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
              />

              {/* متن نوت با اسکرول‌بار مخصوص خودش */}
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder=""
                className="w-full min-h-[110px] md:min-h-[140px] rounded-xl bg-slate-900/70 border border-slate-600/70 px-3 py-2 text-[11px] md:text-xs text-slate-100 resize-none focus:outline-none focus:ring-1 focus:ring-sky-400 scroll-area overflow-auto"
              />

              <div className="flex items-center justify-between text-[10px] md:text-xs text-slate-400">
                <span>کاراکترها: {noteText.length} (بدون محدودیت)</span>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-3 py-1 rounded-full bg-sky-500/85 hover:bg-sky-400 text-slate-950 font-semibold transition"
                >
                  ذخیره نوت
                </button>
              </div>

              {notesList.length > 0 && (
                <div className="mt-1 space-y-1.5 text-[10px] md:text-xs text-slate-100">
                  {notesList.map((n) => {
                    const isEditing = editingNoteId === n.id;
                    return (
                      <div
                        key={n.id}
                        className="rounded-lg bg-slate-900/70 border border-slate-700/80 px-2 py-1.5 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] md:text-xs font-semibold text-sky-300">
                              {n.title || "نوت بدون عنوان"}
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {new Date(n.createdAt).toLocaleString("fa-IR")}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleSaveEditNote}
                                  className="px-2 py-0.5 rounded-full bg-emerald-500/80 hover:bg-emerald-400 text-[9px] text-slate-950"
                                >
                                  ذخیره
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditNote}
                                  className="px-2 py-0.5 rounded-full bg-slate-700/80 hover:bg-slate-600 text-[9px]"
                                >
                                  انصراف
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditNote(n)}
                                  className="px-2 py-0.5 rounded-full bg-sky-500/80 hover:bg-sky-400 text-[9px] text-slate-950"
                                >
                                  ویرایش
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(n.id)}
                                  className="px-2 py-0.5 rounded-full bg-rose-500/80 hover:bg-rose-400 text-[9px] text-slate-950"
                                >
                                  حذف
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="flex flex-col gap-1 mt-1">
                            <input
                              type="text"
                              value={editingNoteTitle}
                              onChange={(e) =>
                                setEditingNoteTitle(e.target.value)
                              }
                              className="w-full rounded-md bg-slate-950/80 border border-slate-600/80 px-2 py-1 text-[10px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
                              placeholder="عنوان نوت"
                            />
                            <textarea
                              value={editingNoteText}
                              onChange={(e) =>
                                setEditingNoteText(e.target.value)
                              }
                              className="w-full rounded-md bg-slate-950/80 border border-slate-600/80 px-2 py-1 text-[10px] text-slate-100 resize-none focus:outline-none focus:ring-1 focus:ring-sky-400"
                              rows={3}
                            />
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap break-words mt-1">
                            {n.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden journal-root"
      style={{
        backgroundImage: `url(${deskBgDesktop})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      dir={isFa ? "rtl" : "ltr"}
    >
      <style>{`
        @media (max-width: 640px) {
          .journal-root {
            background-image: none !important;
            background-color: #020617 !important;
          }

          .mobile-bg {
            background-image: url(${deskBgMobile}) !important;
            background-size: cover !important;
            background-position: center bottom !important;
            background-repeat: no-repeat !important;
            width: 100% !important;
            height: 100% !important;
          }

          /* ❗ مانیتور روی موبایل اسکرول نداشته باشد */
          .journal-monitor {
            overflow: hidden !important;
          }

          /* 🔹 فقط پنل محتوا روی موبایل اسکرول داشته باشد */
          .panel-scroll {
            max-height: 50vh;
            overflow-y: auto;
            overflow-x: hidden;
          }
        }

        .scroll-area {
          scrollbar-width: thin;
          scrollbar-color: rgba(56,189,248,0.8) rgba(15,23,42,0.95);
        }
        .scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .scroll-area::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.95);
          border-radius: 9999px;
        }
        .scroll-area::-webkit-scrollbar-thumb {
          background: rgba(56,189,248,0.85);
          border-radius: 9999px;
        }

        ${starAnimationStyle}
      `}</style>

      <div className="absolute inset-0 mobile-bg" />

      <div className="pointer-events-none absolute inset-0">
        {STAR_POSITIONS.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-star-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-end justify.center pb-[11vh]">
        <div
          className="
            absolute
            overflow-hidden
            journal-monitor
            bg-slate-900/30
            backdrop-blur-[2px]
            border border-white/10
            rounded-[10px]

            left-[15.5%]
            right-[15.4%]
            top-[23.4%]
            bottom-[12.9%]

            max-sm:left-[0.2%]
            max-sm:right-[0.2%]
            max-sm:top-[26.6%]
            max-sm:bottom-[26.5%]
          "
        >
          <div className="w-full h-full flex flex-col px-3 py-3 md:px-5 md:py-4 text-slate-50 text-xs md:text-sm">
            {/* هدر */}
            <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500/80" />
                <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              </div>
              <div className="text-[10px] md:text-xs text-slate-300">
                NIL Journal Board • {topicName}
              </div>
            </div>

            {/* بدنه */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 md:gap-4">
              {/* ستون بخش‌ها (باریک‌تر) */}
              <div className="md:w-[32%] grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-3">
                {SECTIONS.map((sec) => {
                  const active = sec.id === activeId;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveId(sec.id)}
                      className={`group flex flex-col items-start justify-between rounded-2xl border px-2 py-1.5 md:px-3.5 md:py-3 text-right transition-all duration-200 ${
                        active
                          ? "border-sky-400 bg-sky-400/15 shadow-[0_0_18px_rgba(56,189,248,0.45)] scale-[1.02]"
                          : "border-slate-600/70 bg-slate-900/70 hover:border-sky-400/70 hover:bg-slate-900"
                      }`}
                    >
                      <span className="text-[10px] md:text-sm font-semibold leading-tight line-clamp-2">
                        {sec.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* پنل محتوا */}
              <div className="flex-1 min-h-0 rounded-2xl bg-slate-950/50 border border-slate-600/60 px-3 py-3 md:px-4 md:py-4 flex flex-col gap-2 overflow-hidden panel-scroll">
                {renderPanel()}
              </div>
            </div>

            {/* دکمه‌های پایین */}
            <div className="mt-2 flex justify-between items-center gap-2">
              {/* خروج کامل به صفحه لاگین ژورنال */}
              <button
                type="button"
                onClick={onExit}
                className="px-3 py-1.5 rounded-full border border-rose-500/80 bg-rose-600/80 text-[10px] md:text-xs text-slate-50 hover:bg-rose-500 hover:border-rose-300 transition"
              >
                {isFa ? "خروج از ژورنال" : "Exit journal"}
              </button>

              {/* برگشت به صفحه قبل (لیست تاپیک‌ها) */}
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-1.5 rounded-full border border-slate-500/80 bg-slate-900/70 text-[10px] md:text-xs text-slate-100 hover:bg-slate-800 hover:border-sky-400 transition"
              >
                {isFa ? "بازگشت به صفحه قبل" : "Back to topics"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
