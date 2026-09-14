import { useEffect, useState } from "react";

const KEY = "kymrun-secret-gift";

export type SecretGift = { code: string; score: number; wonAt: string };

export function readSecretGift(): SecretGift | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SecretGift) : null;
  } catch {
    return null;
  }
}

export function saveSecretGift(score: number): SecretGift {
  const gift: SecretGift = {
    code: "SECRET-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    score,
    wonAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(gift));
  } catch {
    /* storage unavailable */
  }
  return gift;
}

export function useSecretGift() {
  const [gift, setGift] = useState<SecretGift | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setGift(readSecretGift());
    setHydrated(true);
  }, []);

  return { gift, hydrated, setGift };
}
