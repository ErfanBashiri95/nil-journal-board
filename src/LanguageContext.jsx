import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("fa");

  // موقع لود، از localStorage بخون
  useEffect(() => {
    const saved = localStorage.getItem("nil-lang");
    if (saved === "fa" || saved === "en") {
      setLang(saved);
    }
  }, []);

  // هر بار زبان عوض شد، ذخیره کن
  useEffect(() => {
    localStorage.setItem("nil-lang", lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
