import bgEarth from "./assets/journal-bg-base.jpg";

function JournalTopicSelect({ isFa, username, topics = [], onBack, onOpenTopic }) {
  const title = isFa ? " ژورنال های شما" : "Your Research Topics";
  const subtitle = isFa
    ? ""
    : "Choose one of your selected topics to enter its research board.";

  const hasTopics = topics && topics.length > 0;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-4 overflow-hidden text-white"
      style={{
        backgroundImage: `url(${bgEarth})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* لایه تیره خیلی ملایم برای خوانایی متن */}
      <div className="absolute inset-0 bg-slate-950/30" />

      {/* محتوا */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        {/* عنوان */}
        <div className="text-center drop-shadow-[0_0_16px_rgba(0,0,0,0.8)]">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            {title}
          </h1>
          <p className="text-sm md:text-base opacity-85">
            {subtitle}
          </p>
          {username && (
            <p className="mt-2 text-xs md:text-sm opacity-80">
              {isFa ? "نام کاربری: " : "Username: "}
              <span className="font-semibold">{username}</span>
            </p>
          )}
        </div>

        {/* کارت‌های تاپیک‌ها */}
        {hasTopics ? (
          <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-10">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => onOpenTopic?.(topic.id)}
                className="flex-1 max-w-sm text-right
                           bg-slate-900/60 backdrop-blur-md
                           border border-white/15
                           rounded-2xl px-5 py-4 md:px-7 md:py-6
                           shadow-xl hover:shadow-2xl
                           hover:-translate-y-1
                           transition
                           flex flex-col gap-2"
              >
                <span className="text-xs uppercase tracking-[0.18em] text-sky-300">
                  
                </span>
                <h2 className="text-xl md:text-2xl font-semibold drop-shadow-[0_0_10px_rgba(0,0,0,0.75)] break-words">
                  {topic.topic_title || (isFa ? "تاپیک تحقیقاتی" : "Research Topic")}
                </h2>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs md:text-sm opacity-85 mt-4">
            {isFa
              ? "برای این نام کاربری فعلاً تاپیکی ثبت نشده."
              : "No topics found for this username yet."}
          </p>
        )}

        {/* دکمه بازگشت */}
        <button
          onClick={onBack}
          className="mt-2 px-5 py-1.5 rounded-full 
                     bg-sky-400 hover:bg-sky-300 
                     text-xs md:text-sm font-semibold
                     shadow-lg shadow-sky-500/40 transition"
        >
          {isFa ? "بازگشت" : "Back"}
        </button>
      </div>
    </div>
  );
}

export default JournalTopicSelect;
