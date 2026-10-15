import { useCallback, useEffect, useState } from "react";

const eventName = "herbora:saved-herbs";
const keyFor = (userId: string) => `herbora:saved-herbs:${userId}`;

function readSaved(userId?: string) {
  if (!userId || typeof window === "undefined") return [] as string[];
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(userId)) || "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function useSavedHerbs(userId?: string) {
  const [saved, setSaved] = useState<string[]>(() => readSaved(userId));

  useEffect(() => {
    setSaved(readSaved(userId));
    if (!userId) return;
    const update = () => setSaved(readSaved(userId));
    window.addEventListener(eventName, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(eventName, update);
      window.removeEventListener("storage", update);
    };
  }, [userId]);

  const toggle = useCallback((herbId: string) => {
    if (!userId) return;
    const current = readSaved(userId);
    const next = current.includes(herbId) ? current.filter((id) => id !== herbId) : [...current, herbId];
    localStorage.setItem(keyFor(userId), JSON.stringify(next));
    setSaved(next);
    window.dispatchEvent(new Event(eventName));
  }, [userId]);

  const remove = useCallback((herbId: string) => {
    if (!userId) return;
    const next = readSaved(userId).filter((id) => id !== herbId);
    localStorage.setItem(keyFor(userId), JSON.stringify(next));
    setSaved(next);
    window.dispatchEvent(new Event(eventName));
  }, [userId]);

  const clear = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(keyFor(userId));
    setSaved([]);
    window.dispatchEvent(new Event(eventName));
  }, [userId]);

  return { saved, toggle, remove, clear };
}
