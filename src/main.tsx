import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// تعيين اتجاه الصفحة بناءً على اللغة المحفوظة
const savedLanguage = localStorage.getItem("language") || "ar";
const rtlLanguages = ["ar", "ur"];
document.documentElement.dir = rtlLanguages.includes(savedLanguage) ? "rtl" : "ltr";
document.documentElement.lang = savedLanguage;

createRoot(document.getElementById("root")!).render(<App />);
