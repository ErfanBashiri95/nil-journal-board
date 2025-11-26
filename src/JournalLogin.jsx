import bgEarth from "./assets/journal-bg-base.jpg";
import satellite from "./assets/satellite.png";


function JournalLogin({ isFa, username, setUsername, onBack, onContinue }) {
  const placeholder = isFa
    ? "لطفاً نام کاربری خود را وارد کنید"
    : "Please enter your username";

  const continueText = isFa ? "ادامه" : "Continue";
  const backText = isFa ? "بازگشت" : "Back";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-end pb-20 overflow-hidden"
      style={{
        backgroundImage: `url(${bgEarth})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
        
      {/* کانتینر ماهواره: مسئول حرکت مداری */}
      <div
        className="absolute top-1/2 left-1/2 
                   -translate-x-1/2 -translate-y-1/2
                   animate-sat-orbit
                   w-[360px] md:w-[430px]
                   "
      >
        {/* خود ماهواره: مسئول چرخش ملایم پره‌ها */}
        <img
          src={satellite}
          alt="Research satellite"
          className="w-full
                     opacity-95
                     drop-shadow-[0_0_35px_rgba(255,255,255,0.45)]
                     animate-sat-spin"
        />

        {/* نور قرمز چشمک‌زن – چسبیده به بدنه/آنتن */}
        <div
          className="satellite-beacon"
          style={{
            // نسبت به کانتینر (خود ماهواره) تنظیم شده
            top: "18%", // ارتفاع تقریبی نوک میله
            left: "52%", // کمی متمایل به راست
          }}
        />
      </div>

      {/* باکس ورودی */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-3 px-4">
        {/* input + ادامه */}
        <div
          className="w-full flex items-center gap-2 
                     bg-slate-900/60 backdrop-blur-md 
                     border border-white/20 
                     rounded-full px-4 py-2 shadow-xl"
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 bg-transparent outline-none 
                        text-sm md:text-base placeholder:text-slate-300 
                        ${isFa ? "text-right" : "text-left"}`}
          />

          <button
            onClick={() => onContinue?.()}
            className="px-4 md:px-5 py-1.5 rounded-full 
                       bg-sky-400 hover:bg-sky-300 
                       text-xs md:text-sm font-semibold 
                       shadow-lg shadow-sky-500/40 transition"
          >
            {continueText}
          </button>
        </div>

        {/* دکمه بازگشت */}
        <button
          onClick={onBack}
          className="px-4 md:px-5 py-1.5 rounded-full 
                     bg-sky-400 hover:bg-sky-300 
                     text-xs md:text-sm font-semibold 
                     shadow-lg shadow-sky-500/40 transition"
        >
          {backText}
        </button>
      </div>
    </div>
  );
}

export default JournalLogin;
