import nilLogo from "./assets/nil-logo.png";
import JournalLogin from "./JournalLogin";
import { useLanguage } from "./LanguageContext";
import { useState } from "react";
import JournalTopicSelect from "./JournalTopicSelect";
import JournalTopicBoard from "./JournalTopicBoard";

function App() {
  const { lang, setLang } = useLanguage();
const isFa = lang === "fa";

const [view, setView] = useState("hub"); // hub یا journal-login
const [username, setUsername] = useState(""); // نام کاربری وارد شده

const [selectedTopicId, setSelectedTopicId]=useState(null);


  const title = "NIL Orbit Hub";
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

  return (
    <div
  className="min-h-screen flex flex-col text-white relative"
  style={
    view === "hub"
      ? {
          backgroundImage: "url('/src/assets/galaxy-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {}
  }
>
      {/* ستاره‌ها */}
      <div className="absolute inset-0 stars-layer pointer-events-none" />

      {/* لایه تیره برای خوانایی متن */}
      <div className="absolute inset-0 bg-slate-950/10 pointer-events-none" />

      {/* محتوای اصلی */}
      <div
        className="relative flex flex-col min-h-screen"
        dir={isFa ? "rtl" : "ltr"} // این جهت کلی رو تعیین می‌کند
      >
        {/* Header */}
        {view === "hub" && (
        <header className="w-full py-4 px-6 flex items-center justify-end">
          {/* سوئیچ زبان */}
          <div className="flex items-center gap-2 text-sm bg-violet-700/70 rounded-full px-2 py-1 border border-violet-400/40 backdrop-blur-md shadow-md">
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
        <main className="flex-1 flex items-center justify-center px-4 -mt-15">
          {view === "hub" &&(
          <div className="w-full max-w-none flex flex-col gap-12">

            

            {/* Cards container */}
            <div className="flex flex-col md:flex-row gap-20 justify-center items-stretch">
              {/* NIL Player Card */}
              <div className="flex-1 max-w-[390px] min-h-[400px] rounded-2xl overflow-hidden shadow-xl">
  <div
    className="h-full w-full bg-cover bg-center flex flex-col pt-4 pb-6 px-6 md:pt-6 md:pb-8 md:px-8 relative"
    style={{ backgroundImage: "url('/src/assets/player-bg.jpg')" }}
  >
    

    {/* متن */}
    <div className={`relative z-10 -mt-1 text-center`}>
      <h2 className="text-2xl font-semibold mb-3 drop-shadow-[0_0_12px_rgba(140,170,255,0.95)]">{playerTitle}</h2>
      
    </div>
    

    {/* دکمه پایین وسط */}
    <div className="relative z-10 mt-auto flex justify-center">
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
              <div className="flex-1 max-w-[390px] min-h-[400px] rounded-2xl overflow-hidden shadow-xl">
  <div
    className="h-full w-full bg-cover bg-center flex flex-col pt-4 pb-6 px-6 md:pt-6 md:pb-8 md:px-8 relative"
    style={{ backgroundImage: "url('/src/assets/journal-bg.jpg')" }}
  >
    

    {/* متن */}
    <div className={`relative z-10 -mt-1 text-center`}>
      <h2 className="text-2xl font-semibold mb-3 drop-shadow-[0_0_12px_rgba(140,170,255,0.95)]">{journalTitle}</h2>
      
    </div>

    {/* دکمه پایین وسط */}
    <div className="relative z-10 mt-auto flex justify-center">
    <button
    onClick={()=> setView("journal-login")}
     className="px-5 py-2.5 rounded-full bg-sky-400 hover:bg-sky-300 text-sm font-medium transition shadow-lg shadow-sky-500/30">
  {journalButton}
</button>
    </div>
  </div>
</div>

            </div>
          </div>
          )}
          {view === "journal-login" &&(
            <JournalLogin
            isFa={isFa}
            username={username}
            setUsername={setUsername}
            onBack={()=> setView("hub")}
            onContinue={()=>{
              if(username.trim()){
                setView("topics");
              }
            }}
            />
          )}

{view === "topics" && (
    <JournalTopicSelect
      isFa={isFa}
      username={username}
      onBack={() => setView("journal-login")}
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
      onBack={() => setView("topics")}
    />
  )}
        </main>

        {/* Footer */}
        <footer className="w-full py-4 text-center text-xs opacity-70">
          {footerText}
        </footer>

        {/* لوگوی نیل - فیکس پایین راست */}
        <div className="fixed bottom-1 right-4">
          <img
            src={nilLogo}
            alt="NIL Logo"
            className="w-32 h-32 object-contain opacity-95"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
