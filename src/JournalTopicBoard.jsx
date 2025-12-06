import { useState, useRef, useEffect } from "react";
import deskBgDesktop from "./assets/journal-desk-bg.jpg";
import deskBgMobile from "./assets/journal-desk-bg-mobile.jpg";
import { supabase } from "./lib/supabaseClient";

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
  onBack = () => { },
  onExit = () => { },
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

  // 🔹 وضعیت آپلودهای در حال انجام
  const [uploadProgressList, setUploadProgressList] = useState([]);



  // =========================
  // ذخیره لیست فایل‌ها در localStorage
  // =========================
  const STORAGE_KEY_BASE = "nil_journal_state";

  const getStorageKey = () => {
    const u = username || "guest";
    const t = topicId || "default";
    return `${STORAGE_KEY_BASE}__${u}__${t}`;
  };

  const saveJournalStateToStorage = (nextFilesBySection, nextNotesList) => {
    try {
      if (typeof window === "undefined") return;

      const key = getStorageKey();

      const payload = {
        filesBySection: nextFilesBySection,
        notesList: nextNotesList,
      };

      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.error("localStorage save error:", err);
    }
  };

  // =========================
  // توابع کمکی برای نوت‌ها در Supabase
  // =========================
  const persistNoteRecord = async (note) => {
    try {
      if (!username || !topicId) return note;

      const { data, error } = await supabase
        .from("niljournal_notes")
        .insert({
          username,
          topic_id: topicId,
          title: note.title,
          content: note.content,
        })
        .select("id, created_at")
        .single();

      if (error) {
        console.error("Supabase insert note error:", error);
        return note;
      }

      return {
        ...note,
        id: data.id,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error("persistNoteRecord error:", err);
      return note;
    }
  };

  const updateNoteRecord = async (id, patch) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("niljournal_notes")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Supabase update note error:", error);
      }
    } catch (err) {
      console.error("updateNoteRecord error:", err);
    }
  };

  const deleteNoteRecord = async (id) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("niljournal_notes")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Supabase delete note error:", error);
      }
    } catch (err) {
      console.error("deleteNoteRecord error:", err);
    }
  };


  
  // =========================
  // لود کردن وضعیت از Supabase + localStorage هنگام ورود
  // =========================
  useEffect(() => {
    // اگر هنوز username یا topicId نداریم، کاری نکن
    if (!username || !topicId) return;

    const loadState = async () => {
      try {
        // ۱) فایل‌ها از Supabase
        const { data: filesData, error: filesError } = await supabase
          .from("niljournal_files")
          .select("*")
          .eq("username", username)
          .eq("topic_id", topicId)
          .order("created_at", { ascending: true });

        let remoteFiles = {
          text: [],
          audio: [],
          media: [],
        };

        if (!filesError && filesData && filesData.length > 0) {
          filesData.forEach((row) => {
            if (!remoteFiles[row.section]) return;

            remoteFiles[row.section].push({
              id: row.id, // 👈 id واقعی از دیتابیس
              name: row.file_name,
              type: row.file_type,
              size: row.file_size,
              createdAt: row.created_at,
              recorded: false,
              url: row.url,
              previewUrl:
                row.section === "media" &&
                row.file_type &&
                row.file_type.startsWith("image/")
                  ? row.url
                  : null,
            });
          });
        }

        // ۲) نوت‌ها از Supabase
        const { data: notesData, error: notesError } = await supabase
          .from("niljournal_notes")
          .select("*")
          .eq("username", username)
          .eq("topic_id", topicId)
          .order("created_at", { ascending: true });

        let remoteNotes = [];
        if (!notesError && notesData && notesData.length > 0) {
          remoteNotes = notesData.map((row) => ({
            id: row.id,
            title: row.title || "نوت بدون عنوان",
            content: row.content || "",
            createdAt: row.created_at,
          }));
        }

        // ۳) localStorage (برای fallback)
        let notesFromStorage = [];
        let filesFromStorage = null;

        if (typeof window !== "undefined") {
          const key = getStorageKey();
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) || {};
            filesFromStorage = parsed.filesBySection || null;
            notesFromStorage = parsed.notesList || [];
          }
        }

        // ۴) انتخاب منبع نهایی فایل‌ها
        const hasRemoteFiles = Object.values(remoteFiles).some(
          (arr) => arr && arr.length > 0
        );

        const finalFiles = hasRemoteFiles
          ? remoteFiles
          : filesFromStorage || {
              text: [],
              audio: [],
              media: [],
            };

        // ۵) انتخاب منبع نهایی نوت‌ها
        const finalNotes =
          remoteNotes.length > 0 ? remoteNotes : notesFromStorage || [];

        // ۶) ست‌کردن state
        setFilesBySection(finalFiles);
        setNotesList(finalNotes);

        // ۷) هم‌سان‌سازی localStorage با وضعیت نهایی
        saveJournalStateToStorage(finalFiles, finalNotes);
      } catch (err) {
        console.error("loadState error:", err);
      }
    };

    loadState();
  }, [username, topicId]);









  // 🔹 منوی فایل (Rename/Delete)
  const [fileMenu, setFileMenu] = useState({
    open: false,
    sectionId: null,
    file: null,
    x: 0,
    y: 0,
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

  const uploadRealFile = async (file, onProgress) => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      xhr.open("POST", "https://nilpapd.com/uploads/upload.php");

      // 📊 پیشرفت آپلود
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded * 100) / event.total);
        if (onProgress) onProgress(percent);
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          try {
            const data = JSON.parse(xhr.responseText || "{}");
            if (data.success && data.url) {
              if (onProgress) onProgress(100);
              resolve(data.url);
            } else {
              alert(
                "خطا در آپلود فایل روی سرور" +
                  (data.message ? ": " + data.message : "")
              );
              resolve(null);
            }
          } catch (err) {
            console.error("upload parse error:", err);
            alert("مشکل در پردازش پاسخ سرور آپلود.");
            resolve(null);
          }
        }
      };

      xhr.onerror = () => {
        console.error("upload network error");
        alert("مشکل در ارتباط با سرور آپلود");
        resolve(null);
      };

      xhr.send(formData);
    });
  };


  const persistFileRecord = async (sectionId, fileObj) => {
    try {
      if (!username || !topicId) {
        console.warn("persistFileRecord: missing username/topicId", {
          username,
          topicId,
        });
        return fileObj;
      }
  
      const { data, error } = await supabase
        .from("niljournal_files")
        .insert({
          username,
          topic_id: topicId,
          section: sectionId,
          file_name: fileObj.name,
          file_type: fileObj.type,
          file_size: fileObj.size,
          url: fileObj.url,
        })
        .select("id")
        .single();
  
      console.log("persistFileRecord result =>", { data, error });
  
      if (error) {
        console.error("Supabase insert error:", error);
        alert("خطا در ثبت اطلاعات فایل روی سرور (Supabase).");
        return fileObj;
      }
  
      if (data?.id) {
        // 👈 اینجا id دیتابیسی را روی آبجکت می‌گذاریم
        return { ...fileObj, id: data.id };
      }
  
      return fileObj;
    } catch (err) {
      console.error("persistFileRecord exception:", err);
      alert("مشکل در ارتباط با Supabase هنگام ذخیره فایل.");
      return fileObj;
    }
  };
  



  const deleteFileFromServer = async (fileUrl) => {
    if (!fileUrl) return;

    try {
      await fetch("https://nilpapd.com/uploads/delete.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fileUrl }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) {
            console.warn("مشکل در حذف فایل روی سرور:", data.message);
          }
        });
    } catch (err) {
      console.error("server delete error", err);
    }
  };


  const handleAddFiles = async (sectionId, fileList) => {
    const newFiles = Array.from(fileList || []);
    if (!newFiles.length) return;

    const uploaded = [];

    for (const f of newFiles) {
      // 🔹 یک id مخصوص برای نوار پیشرفت این فایل
      const uploadId = `${sectionId}-upload-${Date.now()}-${Math.random()}`;

      // ۱) اضافه کردن به لیست آپلودهای در حال انجام
      setUploadProgressList((prev) => [
        ...prev,
        {
          id: uploadId,
          name: f.name,
          sectionId,
          progress: 0,
          status: "uploading", // "uploading" | "done" | "error"
        },
      ]);

      // ۲) آپلود با گزارش درصد
      const uploadedUrl = await uploadRealFile(f, (pct) => {
        setUploadProgressList((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, progress: pct } : u
          )
        );
      });

      // اگر آپلود شکست خورد
      if (!uploadedUrl) {
        setUploadProgressList((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: "error" } : u
          )
        );
        continue;
      }

      // ۳) ساخت آبجکت فایل
      const tempId = `${sectionId}-${Date.now()}-${Math.random()}`;
      let fileObj = {
        id: tempId,
        name: f.name,
        size: f.size,
        type: f.type,
        createdAt: new Date().toISOString(),
        recorded: false,
        fileObject: f,
        url: uploadedUrl,
        previewUrl:
          sectionId === "media" && f.type.startsWith("image/")
            ? uploadedUrl
            : null,
      };

      // ۴) ثبت در Supabase و گرفتن id واقعی
      const withDbId = await persistFileRecord(sectionId, fileObj);
      uploaded.push(withDbId);

      // ۵) نوار پیشرفت → ۱۰۰٪ و بعد محو
      setUploadProgressList((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? { ...u, progress: 100, status: "done" }
            : u
        )
      );

      setTimeout(() => {
        setUploadProgressList((prev) =>
          prev.filter((u) => u.id !== uploadId)
        );
      }, 800);
    }

    // ۶) اضافه کردن فایل‌های موفق به state + localStorage
    if (uploaded.length > 0) {
      setFilesBySection((prev) => {
        const next = {
          ...prev,
          [sectionId]: [...prev[sectionId], ...uploaded],
        };
        saveJournalStateToStorage(next, notesList);
        return next;
      });
    }
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

      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const name = `voice-${new Date().toLocaleTimeString("fa-IR")}.webm`;
        const file = new File([blob], name, { type: blob.type });

        // ۱) آپلود روی هاست
        const uploadedUrl = await uploadRealFile(file);

        if (!uploadedUrl) {
          alert("آپلود ویس روی سرور انجام نشد.");
          return;
        }

        // ۲) ساخت آبجکت فایل مثل بقیه
        const fakeFile = {
          id: `audio-recorded-${Date.now()}`,
          name,
          size: blob.size,
          type: blob.type,
          createdAt: new Date().toISOString(),
          recorded: true,
          fileObject: file,
          url: uploadedUrl,
        };

        // 🔹 ثبت در Supabase
        const withDbId = await persistFileRecord("audio", fakeFile);

        setFilesBySection((prev) => {
          const next = {
            ...prev,
            audio: [...prev.audio, withDbId],
          };

          // ⬅️ ذخیرهٔ وضعیت جدید (فایل‌ها + نوت‌ها)
          saveJournalStateToStorage(next, notesList);

          return next;
        });

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

  const handleSaveNote = async () => {
    if (!noteText.trim() && !noteTitle.trim()) return;

    // نوت خام (قبل از ذخیره در دیتابیس)
    const baseNote = {
      // فعلاً id خالی می‌ذاریم، بعد از DB می‌گیریم
      id: null,
      title: noteTitle.trim() || "نوت بدون عنوان",
      content: noteText.trim(),
      createdAt: new Date().toISOString(),
    };

    // اول تلاش برای ثبت در Supabase
    const noteWithDbId = await persistNoteRecord(baseNote);

    // حالا در state ذخیره می‌کنیم
    setNotesList((prev) => {
      const updated = [...prev, noteWithDbId];
      saveJournalStateToStorage(filesBySection, updated);
      return updated;
    });

    setNoteTitle("");
    setNoteText("");
  };



  const handleDeleteNote = async (id) => {
    // ۱) حذف از دیتابیس
    await deleteNoteRecord(id);

    // ۲) حذف از state + localStorage
    setNotesList((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveJournalStateToStorage(filesBySection, updated);
      return updated;
    });

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

  const handleSaveEditNote = async () => {
    if (!editingNoteId) return;

    const trimmedTitle = editingNoteTitle.trim();
    const trimmedContent = editingNoteText.trim();

    // ۱) آپدیت روی Supabase
    await updateNoteRecord(editingNoteId, {
      title: trimmedTitle || "نوت بدون عنوان",
      content: trimmedContent,
    });

    // ۲) آپدیت روی state + localStorage
    setNotesList((prev) => {
      const updated = prev.map((n) =>
        n.id === editingNoteId
          ? {
              ...n,
              title: trimmedTitle || "نوت بدون عنوان",
              content: trimmedContent,
            }
          : n
      );

      saveJournalStateToStorage(filesBySection, updated);
      return updated;
    });

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

  const handleFileRename = async (sectionId, file) => {
    const currentName = file.name || "";
    const newName = window.prompt("نام جدید فایل:", currentName);

    if (!newName || !newName.trim() || newName.trim() === currentName) return;

    const trimmed = newName.trim();

    // ۱) اگر id دیتابیسی داریم، اول Supabase را آپدیت کنیم
    if (file.id) {
      try {
        const { error } = await supabase
          .from("niljournal_files")
          .update({ file_name: trimmed })
          .eq("id", file.id);

        if (error) {
          console.error("Supabase rename error:", error);
          alert("خطا در به‌روزرسانی نام فایل روی سرور.");
          // در صورت خطا، دیگه state را عوض نکن که desync نشه
          return;
        }
      } catch (err) {
        console.error("Supabase rename exception:", err);
        alert("مشکل در ارتباط با سرور هنگام تغییر نام فایل.");
        return;
      }
    } else {
      // برای فایل‌های خیلی قدیمی که id دیتابیسی ندارند (اگر وجود داشته باشند)
      console.warn(
        "این فایل id دیتابیسی ندارد، فقط در localStorage به‌روزرسانی می‌شود."
      );
    }

    // ۲) حالا state و localStorage را به‌روزرسانی می‌کنیم
    setFilesBySection((prev) => {
      const next = {
        ...prev,
        [sectionId]: prev[sectionId].map((f) =>
          f.id === file.id ? { ...f, name: trimmed } : f
        ),
      };

      saveJournalStateToStorage(next, notesList);
      return next;
    });
  };





  // 🔹 حذف فایل از یک سکشن
  const handleFileDelete = async (sectionId, file) => {
    // ۱) حذف فایل از هاست PHP (اگر url داشته باشد)
    if (file?.url) {
      deleteFileFromServer(file.url);
    }

    // ۲) حذف رکورد از Supabase (اگر id دیتابیسی داشته باشد)
    if (file?.id) {
      try {
        const { error } = await supabase
          .from("niljournal_files")
          .delete()
          .eq("id", file.id);

        if (error) {
          console.error("Supabase delete error:", error);
        }
      } catch (err) {
        console.error("Supabase delete exception:", err);
      }
    }

    // ۳) حذف از state + به‌روزرسانی localStorage
    setFilesBySection((prev) => {
      const next = {
        ...prev,
        [sectionId]: prev[sectionId].filter((f) => f.id !== file.id),
      };


      saveJournalStateToStorage(next, notesList);

      return next;
    });
  };




  // 🔹 باز کردن منوی فایل (دابل‌کلیک / راست‌کلیک)
  const openFileMenu = (event, sectionId, file) => {
    event.preventDefault();
    const clickX = event.clientX;
    const clickY = event.clientY;

    setFileMenu({
      open: true,
      sectionId,
      file,
      x: clickX,
      y: clickY,
    });
  };

  const closeFileMenu = () => {
    setFileMenu((prev) => ({ ...prev, open: false }));
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
      <div className="mt-2 pr-1 pb-2 scroll-area files-grid-wrapper">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-3 md:gap-x-4 md:gap-y-4">
          {items.map((f) => (
            <div
              key={f.id}
              className="flex flex-col items-center justify-start text-center cursor-default select-none"
              onContextMenu={(e) => openFileMenu(e, sectionId, f)}
              onDoubleClick={(e) => openFileMenu(e, sectionId, f)}
              title="برای تغییر نام یا حذف، کلیک راست یا دابل‌کلیک کن"
              onClick={() => f.url && window.open(f.url, "_blank")}
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

  const renderUploadProgress = () => {
    if (!uploadProgressList.length) return null;

    return (
      <div className="mb-2 space-y-1">
        {uploadProgressList.map((u) => (
          <div
            key={u.id}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] md:text-xs
                        shadow-[0_0_14px_rgba(56,189,248,0.45)]
            ${
              u.status === "error"
                ? "bg-rose-900/70 border-rose-500/70 text-rose-100"
                : "bg-slate-900/80 border-sky-500/70 text-sky-100"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate max-w-[150px] md:max-w-[220px]">
                  {u.name}
                </span>

                {u.status === "error" ? (
                  <span className="text-[9px] md:text-[10px]">
                    خطا
                  </span>
                ) : (
                  <span className="tabular-nums">{u.progress}%</span>
                )}
              </div>

              {u.status !== "error" && (
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-400 transition-[width] duration-150 ease-out"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
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
            className="mt-1 rounded-xl border border-emerald-500/60 border-dashed bg-emerald-500/5 hover:bg-emerald-500/10 transition px-3 py-3 flex flex-col gap-2 items-center justify-center text-center"
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
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] md:text-xs transition ${isRecording
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
          <h2 className="text-sm md:text-base font-semibold">
            نوت‌های تحقیق
          </h2>
          <p className="text-[10px] md:text-xs text-slate-300">
            اینجا می‌تونی متن، ایده‌ها و لینک‌های مهم (مقاله، ویدئو، سایت‌ها)
            رو برای این تاپیک ذخیره کنی.
          </p>

          {/* 🔹 کل بخش نوت‌ها (از اینجا تا آخر) توسط panel-scroll اسکرول می‌شود */}
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            {/* عنوان نوت */}
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="عنوان نوت (مثلاً: منابع اصلی تحقیق)"
              className="w-full rounded-xl bg-slate-900/70 border border-slate-600/70 px-3 py-1.5 text-[11px] md:text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />

            {/* متن نوت با اسکرول مخصوص خودش */}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder=""
              className="w-full min-h-[110px] md:min-h-[140px] rounded-xl bg-slate-900/70 border border-slate-600/70 px-3 py-2 text-[11px] md:text-xs text-slate-100 resize-none focus:outline-none focus:ring-1 focus:ring-sky-400 scroll-area overflow-auto note-textarea"
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

          .note-textarea {
            max-height: 140px;
            overflow-y:auto;
            -webkit-overflow-scrolling: touch;
          }

          .mobile-bg {
            background-image: url(${deskBgMobile}) !important;
            background-size: cover !important;
            background-position: center bottom !important;
            background-repeat: no-repeat !important;
            width: 100% !important;
            height: 100% !important;
          }

          /* مانیتور خودش اسکرول نداشته باشه؛ فقط پنل داخلی اسکرول شود */
          .journal-monitor {
            overflow: hidden !important;
          }

          /* روی موبایل، گرید فایل‌ها ارتفاع ثابت نداشته باشه تا کامل دیده بشه */
          .files-grid-wrapper {
            max-height: none !important;
            overflow: visible !important;
          }
        }

        /* اسکرول عمومی پنل محتوا (برای موبایل + دسکتاپ) */
        .panel-scroll {
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
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

      <div className="absolute inset-0 flex items-end justify-center pb-[11vh]">
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
            top-[21.6%]
            bottom-[10.6%]

            max-sm:left-[0.2%]
            max-sm:right-[0.2%]
            max-sm:top-[26.8%]
            max-sm:bottom-[26.6%]
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

            {/*نوارهای پیشرفت آپلود فایل ها*/}
            {renderUploadProgress()}

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
                      className={`group flex flex-col items-start justify-between rounded-2xl border px-2 py-1.5 md:px-3.5 md:py-3 text-right transition-all duration-200 ${active
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
              <div className="flex-1 min-h-0 rounded-2xl bg-slate-950/50 border border-slate-600/60 px-3 py-3 md:px-4 md:py-4 flex flex-col gap-2 overflow-hidden panel-scroll scroll-area">
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

      {/* 🔹 منوی راست‌کلیک/دابل‌کلیک برای فایل‌ها */}
      {fileMenu.open && fileMenu.file && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeFileMenu}
        >
          <div
            className="absolute z-50 min-w-[140px] rounded-xl bg-slate-900/95 border border-slate-600 shadow-lg text-[11px] md:text-xs text-slate-100"
            style={{
              top: fileMenu.y,
              left: fileMenu.x,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="w-full text-right px-3 py-2 hover:bg-slate-800"
              onClick={() => {
                if (fileMenu.sectionId && fileMenu.file) {
                  handleFileRename(fileMenu.sectionId, fileMenu.file);
                }
                closeFileMenu();
              }}
            >
              تغییر نام فایل
            </button>
            <button
              type="button"
              className="w-full text-right px-3 py-2 text-rose-300 hover:bg-rose-600/20"
              onClick={() => {
                if (
                  fileMenu.sectionId &&
                  fileMenu.file &&
                  window.confirm("آیا از حذف این فایل مطمئن هستی؟")
                ) {
                  handleFileDelete(fileMenu.sectionId, fileMenu.file);
                }
                closeFileMenu();
              }}
            >
              حذف فایل
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
//end