import { useState, useEffect } from "react";
import nilLogo from "./assets/nil-logo.png";
import galaxyBg from "./assets/galaxy-bg.png";
import playerBg from "./assets/player-bg.jpg";
import journalBg from "./assets/journal-bg.jpg";

import JournalLogin from "./JournalLogin";
import { useLanguage } from "./LanguageContext";
import JournalTopicSelect from "./JournalTopicSelect";
import JournalTopicBoard from "./JournalTopicBoard";

// 🔹 یک کمک‌تابع برای خواندن state ذخیره‌شده
function loadSavedState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("niljournal_state");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function App() {
  const { lang, setLang } = useLanguage();
  const isFa = lang === "fa";

  // 🔹 مقدار اولیه view از localStorage (اگر بود)؛ وگرنه "hub"
  const [view, setView] = useState(() => {
    const saved = loadSavedState();
    return saved?.view || "hub";
  });

  const [username, setUsername] = useState(() => {
    const saved = loadSavedState();
    return saved?.username || "";
  });

  const [topics, setTopics] = useState(() => {
    const saved = loadSavedState();
    return Array.isArray(saved?.topics) ? saved.topics : [];
  });

  const [selectedTopicId, setSelectedTopicId] = useState(() => {
    const saved = loadSavedState();
    return saved?.selectedTopicId || null;
  });

  const title = "HELIX Orbit Hub";
  const subtitle = isFa
    ? "از اینجا وارد پلیر دوره‌ها و اتاق‌های تحقیقاتی خودت می‌شی."
    : "From here you access the course player and your research boards.";

  const playerTitle = "NIL Player";
  const playerDesc = isFa
    ? "مشاهده‌ی جلسات، ویدیوها و تمرین‌های دوره‌های NIL."
    : "Watch sessions, videos and exercises of NIL programs.";
  const playerButton = isFa ? "ورود" : "Enter Player";

  const journalTitle = "NIL Journal Board";
  const journalDesc = isFa
    ? "اتاق تحقیقاتی تاپیک‌هایی که برای مسیر نخبگی انتخاب کرده‌ای."
    : "Your research chambers for topics in your mastery journey.";
  const journalButton = isFa ? "ورود" : "Enter Journal Board";

  const footerText = "© NIL Coaching Academy — Helix Orbit";

  // 🔹 فقط زبان را (اگر ذخیره شده) روی Context ست می‌کنیم
  useEffect(() => {
    const saved = loadSavedState();
    if (saved?.lang) {
      setLang(saved.lang);
    }
  }, [setLang]);

  // 🔹 هر تغییری در state → ذخیره در localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stateToSave = {
      lang,
      view,
      username,
      topics,
      selectedTopicId,
    };
    try {
      window.localStorage.setItem(
        "niljournal_state",
        JSON.stringify(stateToSave)
      );
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  }, [lang, view, username, topics, selectedTopicId]);

  // ✅ برای اسم تاپیک در Board
  const activeTopic = topics.find((t) => t.id === selectedTopicId);

  return (
    <div
      className="min-h-screen flex flex-col text-white relative overflow-x-hidden"
      style={
        view === "hub"
          ? {
              backgroundImage: `url(${galaxyBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      {/* تنظیم سایز کارت‌ها مخصوص موبایل */}
      <style>{`
  @media (max-width: 640px) {
    .hub-card {
      width: 88vw;
      max-width: 300px;
      min-height: 260px !important; /* کارت کشیده‌تر */
    }
  
    .hub-card > div {
      min-height: 320px !important; /* 🔥 مهم‌ترین خط */
    }
  }

  @media (min-width: 641px) {
    .hub-card {
      width: 90%;
      max-width: 390px;
      min-height: 400px;
    }
  }
`}</style>

      {/* ستاره‌ها */}
      <div className="absolute inset-0 stars-layer pointer-events-none" />

      {/* لایه تیره برای خوانایی متن */}
      <div className="absolute inset-0 bg-slate-950/10 pointer-events-none" />

      {/* محتوای اصلی */}
      <div
        className="relative flex flex-col min-h-screen"
        dir={isFa ? "rtl" : "ltr"}
      >
        {/* Header فقط در هاب */}
        {view === "hub" && (
          <header className="w-full py-3 px-4 md:py-4 md:px-6 flex items-center justify-end">
            <div className="flex items-center gap-2 text-xs md:text-sm bg-violet-700/70 rounded-full px-2 py-1 border border-violet-400/40 backdrop-blur-md shadow-md">
              <button
                onClick={() => setLang("fa")}
                className={`px-2 py-0.5 rounded-full transition ${
                  isFa ? "bg-white text-black" : "text-white/80"
                }`}
              >
                فارسی
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded-full transition ${
                  !isFa ? "bg-white text-black" : "text-white/80"
                }`}
              >
                EN
              </button>
            </div>
          </header>
        )}

        {/* Main */}
        <main className="flex-1 flex items-center justify-center px-3 md:px-4 mt-4 md:mt-0">
          {view === "hub" && (
            <div className="w-full max-w-5xl flex flex-col gap-8 md:gap-12">
              <div className="flex flex-col md:flex-row gap-8 md:gap-20 justify-center items-stretch">
                {/* NIL Player Card */}
                <div className="hub-card flex-1 rounded-2xl overflow-hidden shadow-xl mx-auto">
                  <div
                    className="h-full w-full bg-cover bg-center flex flex-col pt-4 pb-6 px-5 md:pt-6 md:pb-8 md:px-8 relative"
                    style={{ backgroundImage: `url(${playerBg})` }}
                  >
                    <div className="relative z-10 -mt-1 text-center">
                      <h2 className="text-xl md:text-2xl font-semibold mb-3 drop-shadow-[0_0_12px_rgba(140,170,255,0.95)]">
                        {playerTitle}
                      </h2>
                    </div>

                    <div className="relative z-10 mt-auto flex justify-center pb-1 md:pb-0">
                      <a
                        href="https://nil-player.nilpapd.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-full bg-sky-400 hover:bg-sky-300 text-sm font-medium transition shadow-lg shadow-sky-500/30"
                      >
                        {playerButton}
                      </a>
                    </div>
                  </div>
                </div>

                {/* NIL Journal Board Card */}
                <div className="hub-card flex-1 rounded-2xl overflow-hidden shadow-xl mx-auto">
                  <div
                    className="h-full w-full bg-cover bg-center flex flex-col pt-4 pb-6 px-5 md:pt-6 md:pb-8 md:px-8 relative"
                    style={{ backgroundImage: `url(${journalBg})` }}
                  >
                    <div className="relative z-10 -mt-1 text-center">
                      <h2 className="text-xl md:text-2xl font-semibold mb-3 drop-shadow-[0_0_12px_rgba(140,170,255,0.95)]">
                        {journalTitle}
                      </h2>
                    </div>

                    <div className="relative z-10 mt-auto flex justify-center pb-1 md:pb-0">
                      <button
                        onClick={() => setView("journal-login")}
                        className="px-5 py-2.5 rounded-full bg-sky-400 hover:bg-sky-300 text-sm font-medium transition shadow-lg shadow-sky-500/30"
                      >
                        {journalButton}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "journal-login" && (
            <JournalLogin
              isFa={isFa}
              username={username}
              setUsername={setUsername}
              onBack={() => setView("hub")}
              onContinue={(payload) => {
                if (!payload) return;
                const {
                  mode,
                  username: normalizedUsername,
                  topics: loadedTopics,
                } = payload;

                if (normalizedUsername) {
                  setUsername(normalizedUsername);
                }

                setTopics(loadedTopics || []);

                if (
                  mode === "single" &&
                  loadedTopics &&
                  loadedTopics.length === 1
                ) {
                  setSelectedTopicId(loadedTopics[0].id);
                  setView("board");
                } else {
                  setSelectedTopicId(null);
                  setView("topics");
                }
              }}
            />
          )}

          {view === "topics" && (
            <JournalTopicSelect
              isFa={isFa}
              username={username}
              topics={topics}
              onBack={() => {
                setSelectedTopicId(null);
                setView("journal-login");
              }}
              onOpenTopic={(topicId) => {
                setSelectedTopicId(topicId);
                setView("board");
              }}
            />
          )}

          {view === "board" && (
            <JournalTopicBoard
              isFa={isFa}
              username={username}
              topicId={selectedTopicId}
              topicTitle={activeTopic?.topic_title}
              onBack={() => {
                if (topics.length > 1) {
                  setView("topics");
                } else {
                  setSelectedTopicId(null);
                  setView("journal-login");
                }
              }}
              onExit={() => {
                setUsername("");
                setTopics([]);
                setSelectedTopicId(null);
                setView("journal-login");
              }}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="w-full py-3 md:py-4 text-center text-[10px] md:text-xs opacity-70">
          {footerText}
        </footer>

        {/* لوگوی نیل - فیکس پایین راست */}
        <div className="fixed bottom-1 right-3 md:right-4">
          <img
            src={nilLogo}
            alt="NIL Logo"
            className="w-24 h-24 md:w-32 md:h-32 object-contain opacity-95"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
