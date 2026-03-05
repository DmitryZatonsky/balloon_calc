import type { DraftProduct } from "./types";

export function formatMoney(value: number, currencyAbbr: string = "грн"): string {
  return `${value.toLocaleString("ru-RU")} ${currencyAbbr}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function buildIdFromDate(date: Date): string {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = String(date.getFullYear()).slice(-2);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}${month}${year}-${hours}${minutes}`;
}

export function createDraftProduct(): DraftProduct {
  return { id: crypto.randomUUID(), name: "", price: "", priceMode: "fixed" };
}

export function buildItemKey(categoryId: string, productId: string): string {
  return `${categoryId}::${productId}`;
}

export function keepDigits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function readArrayFromStorage<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeToStorage(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
