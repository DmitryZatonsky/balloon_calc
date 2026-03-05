import type { DraftProduct, ResultLanguage } from "./types";

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

export function translateCategoryName(categoryName: string, lang: ResultLanguage): string {
  if (lang === "ru") {
    return categoryName;
  }

  const categoryMapUa: Record<string, string> = {
    "Латекс": "Латекс",
    "Латекс гиганты": "Латекс гіганти",
    "Баблс": "Баблз",
    "Фольга": "Фольга",
    "Фигуры": "Фігури",
    "Коробки": "Коробки",
    "Декор": "Декор",
    "Гендерный шар": "Гендерна куля",
    "Дополнительно": "Додатково",
    "Доставка": "Доставка",
  };

  return categoryMapUa[categoryName] ?? categoryName;
}

export function translateProductName(productName: string, lang: ResultLanguage): string {
  if (lang === "ru") {
    return productName;
  }

  const productMapUa: Record<string, string> = {
    "Хром": "Хром",
    "Конфетти": "Конфеті",
    "Пастель": "Пастель",
    "С рисунком": "З малюнком",
    "С бантиками": "З бантиками",
    "С краской": "З фарбою",
    "Мини шары": "Міні кулі",
    "С фатином": "З фатином",
    "С пенопластом": "З пінопластом",
    "С шариками": "З кульками",
    "С перьями": "З пір'ям",
    "С долларами": "З доларами",
    "Гигант": "Гігант",
    "Стеклянный": "Скляний",
    "Бройлерные": "Бройлерні",
    "Цветной": "Кольоровий",
    "Черный": "Чорний",
    "Чорный": "Чорний",
    "Сердца 45 см": "Серця 45 см",
    "Сердца 70 см": "Серця 70 см",
    "Сердца 90 см": "Серця 90 см",
    "Без декора": "Без декору",
    "С декором": "З декором",
    "Атласные ленты": "Атласні стрічки",
    "Хвостик": "Хвостик",
    "Цепочка из шаров": "Ланцюжок з куль",
    "Фото": "Фото",
    "Надпись": "Напис",
    "Доставка": "Доставка",
    "Коробки": "Коробки",
    "XS": "XS",
    "S": "S",
    "M": "M",
    "L": "L",
    "XL": "XL",
  };

  return productMapUa[productName] ?? productName;
}
