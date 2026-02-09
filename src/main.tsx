import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// تعيين اتجاه الصفحة بناءً على اللغة المحفوظة
const savedLanguage = localStorage.getItem("language") || "ar";
const rtlLanguages = ["ar", "ur"];
document.documentElement.dir = rtlLanguages.includes(savedLanguage) ? "rtl" : "ltr";
document.documentElement.lang = savedLanguage;

// تطبيق الوضع الليلي المحفوظ
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
