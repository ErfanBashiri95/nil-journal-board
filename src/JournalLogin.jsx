import { useState } from "react";
import bgEarth from "./assets/journal-bg-base.jpg";
import satellite from "./assets/satellite.png";
import { supabase } from "./lib/supabaseClient";

const LOCAL_TOPICS = [
  // 1. akramvafaei02
  { id: "local-1-1", username: "akramvafaei02", topic_title: "عدل و تعادل", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-1-2", username: "akramvafaei02", topic_title: "عمل یا حرکت موثر", created_at: "2024-12-02T10:00:00Z" },

  // 2. elhamshakibafar02
  { id: "local-2-1", username: "elhamshakibafar02", topic_title: "تکنیک ها و ابزارهای کوچینگ(۱):برانگیختن آگاهی", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-2-2", username: "elhamshakibafar02", topic_title: "تکنیک ها و ابزارهای کوچینگ(۲):کشف مسئله اصلی", created_at: "2024-12-02T10:00:00Z" },

  // 3. zeynabasadi02
  { id: "local-3-1", username: "zeynabasadi02", topic_title: "انعطاف پذیری و گشودگی", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-3-2", username: "zeynabasadi02", topic_title: "ایجاد اعتماد و امنیت در ارتباط و رابطه", created_at: "2024-12-02T10:00:00Z" },

  // 4. hashemipoor02
  { id: "local-4-1", username: "hashemipoor02", topic_title: "سکوت، مکث، ضرباهنگ", created_at: "2024-12-01T10:00:00Z" },

  // 5. saedehkarami02
  { id: "local-5-1", username: "saedehkarami02", topic_title: "خشوع و کوچ پذیری", created_at: "2024-12-01T10:00:00Z" },

  // 6. samanehbahrami02
  { id: "local-6-1", username: "samanehbahrami02", topic_title: "بودن و عملکرد", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-6-2", username: "samanehbahrami02", topic_title: "نیازها و راهبردها", created_at: "2024-12-02T10:00:00Z" },

  // 7. sohrabkhorrami02
  { id: "local-7-1", username: "sohrabkhorrami02", topic_title: "مسئولیت پذیری", created_at: "2024-12-01T10:00:00Z" },

  // 8. mohsenmortazavi02
  { id: "local-8-1", username: "mohsenmortazavi02", topic_title: "بازخورد موثر", created_at: "2024-12-01T10:00:00Z" },

  // 9. shivakhalilian02
  { id: "local-9-1", username: "shivakhalilian02", topic_title: "رسالت و معنای زندگی: تطبیق طولی", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-9-2", username: "shivakhalilian02", topic_title: "کوچینگ تحول آفرین", created_at: "2024-12-02T10:00:00Z" },

  // 10. tahereharam02
  { id: "local-10-1", username: "tahereharam02", topic_title: "ریسمان", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-10-2", username: "tahereharam02", topic_title: "برنامه‌گزاری", created_at: "2024-12-02T10:00:00Z" },

  // 11. fatemeheskandari02
  { id: "local-11-1", username: "fatemeheskandari02", topic_title: "همدلی", created_at: "2024-12-01T10:00:00Z" },

  // 12. fatemehpouryafar02
  { id: "local-12-1", username: "fatemehpouryafar02", topic_title: "گوش دادن(۱): شنیدن و شنیده شدن", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-12-2", username: "fatemehpouryafar02", topic_title: "گوش دادن(۲): موانع شنوایی", created_at: "2024-12-02T10:00:00Z" },

  // 13. fatemehmalakouti02
  { id: "local-13-1", username: "fatemehmalakouti02", topic_title: "زمینه و بستر (context)", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-13-2", username: "fatemehmalakouti02", topic_title: "کاریزما", created_at: "2024-12-02T10:00:00Z" },

  // 14. farzanehmontazeri02
  { id: "local-14-1", username: "farzanehmontazeri02", topic_title: "باورها و تعهدهای پنهان", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-14-2", username: "farzanehmontazeri02", topic_title: "آنالوژی و متافور (تمثیل و استعاره)", created_at: "2024-12-02T10:00:00Z" },

  // 15. faribajalali02
  { id: "local-15-1", username: "faribajalali02", topic_title: "مشاهده", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-15-2", username: "faribajalali02", topic_title: "احساس‌ها و افکار", created_at: "2024-12-02T10:00:00Z" },

  // 16. mohamadhasanrohani02
  { id: "local-16-1", username: "mohamadhasanrohani02", topic_title: "ارزش‌ها و ماموریت زندگی: تطبیق عرضی", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-16-2", username: "mohamadhasanrohani02", topic_title: "قدردانی", created_at: "2024-12-02T10:00:00Z" },

  // 17. maryamshoul02
  { id: "local-17-1", username: "maryamshoul02", topic_title: "توجه و حضور", created_at: "2024-12-01T10:00:00Z" },

  // 18. nedamalekshahi02
  { id: "local-18-1", username: "nedamalekshahi02", topic_title: "تمامیت", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-18-2", username: "nedamalekshahi02", topic_title: "اعتماد به نفس و عزت نفس", created_at: "2024-12-02T10:00:00Z" },

  // 19. vidasamadi02
  { id: "local-19-1", username: "vidasamadi02", topic_title: "تکنیک های مواجهه در امبیوالانس", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-19-2", username: "vidasamadi02", topic_title: "لکه تمامیتی و حوزه نفوذ راهبری", created_at: "2024-12-02T10:00:00Z" },

  // 20. yeganemomenifard02
  { id: "local-20-1", username: "yeganemomenifard02", topic_title: "تجلیل، جشن، سوگواری", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-20-2", username: "yeganemomenifard02", topic_title: "بازسازی دیدگاه(۲): تغییر زاویه نگاه", created_at: "2024-12-02T10:00:00Z" },

  // 21. zahraashurdokht02
  { id: "local-21-1", username: "zahraashurdokht02", topic_title: "کفایت و کمبود", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-21-2", username: "zahraashurdokht02", topic_title: "بازسازی دیدگاه(۱): آیکیدو", created_at: "2024-12-02T10:00:00Z" },

  // 22. mojdehbarati02
  { id: "local-22-1", username: "mojdehbarati02", topic_title: "قهرمان دیدن مراجع", created_at: "2024-12-01T10:00:00Z" },

  // 23. erfanbashiri02
  { id: "local-23-1", username: "erfanbashiri02", topic_title: "تستی۱", created_at: "2024-12-01T10:00:00Z" },
  { id: "local-23-2", username: "erfanbashiri02", topic_title: "تستی₂", created_at: "2024-12-02T10:00:00Z" },

  // 24. alibashiri02
  { id: "local-24-1", username: "alibashiri02", topic_title: "تستی۳", created_at: "2024-12-01T10:00:00Z" },

  // 25. allimogh02
  { id: "local-25-1", username: "allimogh02", topic_title: "تستی۴", created_at: "2024-12-01T10:00:00Z" },
];

function findLocalTopics(usernameRaw) {
  const normalized = (usernameRaw || "").trim().toLowerCase();
  return LOCAL_TOPICS.filter(
    (t) => t.username.toLowerCase() === normalized
  );
}


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
    const raw = (username || "").trim();

    if (!raw) {
      setErrorMsg(
        isFa
          ? "لطفاً نام کاربری خود را وارد کن."
          : "Please enter your username."
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const normalized = raw.toLowerCase();

      // 🔹 مرحله ۱ — تلاش اول: لیست محلی (LOCAL_TOPICS)
      const local = findLocalTopics(normalized);

      if (local && local.length > 0) {
        console.log("LOCAL TOPIC FOUND:", local);

        setLoading(false);
        setUsername(local[0].username);

        const payload =
          local.length === 1
            ? {
              mode: "single",
              username: local[0].username,
              topics: local,
            }
            : {
              mode: "multi",
              username: local[0].username,
              topics: local,
            };

        onContinue?.(payload);
        return; // ✔ پایان — دیگر supabase لازم نیست
      }

      // 🔹 مرحله ۲ — اگر در لیست نبود، برو سراغ Supabase
      const { data, error } = await supabase
        .from("niljournal_topics")
        .select("id, username, topic_title, created_at")
        .ilike("username", normalized)
        .order("created_at", { ascending: true });

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
            ? "چنین نام کاربری‌ای پیدا نشد."
            : "No journal found for this username."
        );
        return;
      }

      setUsername(data[0].username);

      const payload =
        data.length === 1
          ? { mode: "single", username: data[0].username, topics: data }
          : { mode: "multi", username: data[0].username, topics: data };

      onContinue?.(payload);
    } catch (err) {
      console.error("Unexpected error:", err);
      setLoading(false);
      setErrorMsg(
        isFa ? "یک خطای غیرمنتظره رخ داد." : "Unexpected error occurred."
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
                       ${loading
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
