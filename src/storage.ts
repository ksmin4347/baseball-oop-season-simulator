import type { SeasonState } from "./types";

const STORAGE_KEY = "baseball-oop-season-simulator-v12";

export const saveSeason = (season: SeasonState) => {
  const withTime = { ...season, lastSavedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withTime));
  } catch (error) {
    console.warn("시즌 자동 저장에 실패했지만, 현재 화면 진행은 계속됩니다.", error);
  }
  return withTime;
};

export const loadSeason = (): SeasonState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SeasonState;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const clearSeason = () => {
  localStorage.removeItem(STORAGE_KEY);
};