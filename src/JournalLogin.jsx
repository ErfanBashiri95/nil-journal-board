import { useState } from "react";
import bgEarth from "./assets/journal-bg-base.jpg";
import satellite from "./assets/satellite.png";
import { supabase } from "./lib/supabaseClient";

function JournalLogin({ isFa, username, setUsername, onBack, onContinue }) {
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const placeholder = isFa
    ? "لطفاً نام کاربری خود را وارد کنید"
    : "Please enter your username";

  const continueText = loading
    ? isFa
      ? "در حال بررسی..."
      : "Checking..."
    : isFa
    ? "ادامه"
    : "Continue";

  const backText = isFa ? "بازگشت" : "Back";

  const handleContinue = async () => {
    // ۱) تمیز کردن یوزرنیم
    const rawInput = (username || "").trim();
  
    if (!rawInput) {
      setErrorMsg(
        isFa
          ? "لطفاً نام کاربری خود را وارد کن."
          : "Please enter your username."
      );
      return;
    }
  
    // هم برای لاجیک استفاده می‌کنیم، هم تو state نگه می‌داریم
    const cleaned = rawInput.toLowerCase();
  
    // یوزرنیم تمیز شده رو تو state بالا هم ست کن
    setUsername(cleaned);
  
    setErrorMsg("");
    setLoading(true);
  
    try {
      console.log("🔍 JournalLogin – searching topics for username:", {
        rawInput,
        cleaned,
      });
      console.log(
        "🔗 SUPABASE URL in frontend:",
        import.meta.env.VITE_SUPABASE_URL
      );
  
      const { data, error } = await supabase
        .from("niljournal_topics")
        .select("id, username, topic_title, created_at")
        .ilike("username", cleaned) // حساس‌نبودن به کوچیک/بزرگ
        .order("created_at", { ascending: true });
  
      console.log("📦 Supabase result in JournalLogin:", { error, data });
  
      setLoading(false);
  
      if (error) {
        console.error("Supabase error:", error);
        setErrorMsg(
          isFa
            ? "خطا در ارتباط با سرور. لطفاً کمی بعد دوباره تلاش کن."
            : "Server error. Please try again later."
        );
        return;
      }
  
      if (!data || data.length === 0) {
        setErrorMsg(
          isFa
            ? "چنین نام کاربری‌ای پیدا نشد. لطفاً یوزرنیم را چک کن."
            : "No journal found for this username. Please check it."
        );
        return;
      }
  
      // ✅ نام کاربری را از دیتابیس می‌گیریم (اگر مثلاً حروفش فرق داشت)
      const dbUsername = (data[0].username || cleaned).trim();
  
      // برگردون تو state اصلی
      setUsername(dbUsername);
  
      const payload =
        data.length === 1
          ? {
              mode: "single",
              username: dbUsername,
              topics: data,
            }
          : {
              mode: "multi",
              username: dbUsername,
              topics: data,
            };
  
      onContinue?.(payload);
    } catch (err) {
      console.error("Unexpected error:", err);
      setLoading(false);
      setErrorMsg(
        isFa
          ? "یک خطای غیرمنتظره رخ داد. دوباره امتحان کن."
          : "Unexpected error. Please try again."
      );
    }
  };
  

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleContinue();
    }
  };

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
      {/* کانتینر ماهواره */}
      <div
        className="absolute top-1/2 left-1/2 
                   -translate-x-1/2 -translate-y-1/2
                   animate-sat-orbit
                   w-[360px] md:w-[430px]"
      >
        <img
          src={satellite}
          alt="Research satellite"
          className="w-full opacity-95 drop-shadow-[0_0_35px_rgba(255,255,255,0.45)] animate-sat-spin"
        />
        <div
          className="satellite-beacon"
          style={{ top: "18%", left: "52%" }}
        />
      </div>

      {/* باکس ورودی */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-2.5 px-4">
        <div
          className="w-full flex items-center gap-2 
                     bg-slate-900/60 backdrop-blur-md 
                     border border-white/20 
                     rounded-full px-4 py-2 shadow-xl"
        >
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 bg-transparent outline-none 
                        text-sm md:text-base placeholder:text-slate-300 
                        ${isFa ? "text-right" : "text-left"}`}
          />

          <button
            onClick={handleContinue}
            disabled={loading}
            className={`px-4 md:px-5 py-1.5 rounded-full 
                       text-xs md:text-sm font-semibold 
                       shadow-lg shadow-sky-500/40 transition
                       ${
                         loading
                           ? "bg-sky-300/70 cursor-wait"
                           : "bg-sky-400 hover:bg-sky-300"
                       }`}
          >
            {continueText}
          </button>
        </div>

        {errorMsg && (
          <div className="w-full text-[11px] md:text-xs text-rose-300 text-center">
            {errorMsg}
          </div>
        )}

        <button
          onClick={onBack}
          className="mt-1 px-4 md:px-5 py-1.5 rounded-full 
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
