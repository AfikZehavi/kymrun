import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "kymrun-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as "dark" | "light") || "dark";
    setTheme(stored);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(KEY, next);
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "מצב בהיר" : "מצב כהה"}
      className="grid size-11 place-items-center rounded-full border border-border bg-card transition-transform active:scale-95"
    >
      {theme === "dark" ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </button>
  );
}
