import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Category,
  CalculationLine,
  DraftProduct,
  PriceData,
  Product,
  ResultLanguage,
  SavedCalculation,
  Screen,
} from "../types";
import {
  buildIdFromDate,
  buildItemKey,
  createDraftProduct,
  readArrayFromStorage,
  translateCategoryName,
  translateProductName,
  writeToStorage,
} from "../utils";
import { useArchive } from "./useArchive";
import { useCalcEngine } from "./useCalcEngine";

const BASE_URL = import.meta.env.BASE_URL;
const PRICE_FILE = `${BASE_URL}price.json`;
const DATA_FILE = `${BASE_URL}data.json`;
const CALCULATIONS_KEY = "balloon_calc_calculations";
const EXTRA_CATEGORIES_KEY = "balloon_calc_extra_categories";
const EXTRA_PRODUCTS_KEY = "balloon_calc_extra_products_by_category";
const HIDDEN_CATEGORY_IDS_KEY = "balloon_calc_hidden_category_ids";
const HIDDEN_PRODUCT_IDS_KEY = "balloon_calc_hidden_product_ids_by_category";
const PRICE_OVERRIDES_KEY = "balloon_calc_price_overrides";
const CURRENCY_ABBR_KEY = "balloon_calc_currency_abbr";
const DELIVERY_CATEGORY_ID = "delivery";
const DELIVERY_PRODUCT_ID = "delivery-custom";

export function useBalloonCalc() {
  const [screen, setScreenState] = useState<Screen>("home");
  const backStackRef = useRef<Screen[]>([]);
  const forwardStackRef = useRef<Screen[]>([]);
  const [priceData, setPriceData] = useState<PriceData>({ categories: [] });
  const [extraCategories, setExtraCategories] = useState<Category[]>([]);
  const [extraProductsByCategory, setExtraProductsByCategory] = useState<Record<string, Product[]>>({});
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<string[]>([]);
  const [hiddenProductIdsByCategory, setHiddenProductIdsByCategory] = useState<
    Record<string, string[]>
  >({});
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [currencyAbbr, setCurrencyAbbr] = useState<string>("грн");

  const [saveMessage, setSaveMessage] = useState<string>("");
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [formMessage, setFormMessage] = useState<string>("");
  const [archiveMessage, setArchiveMessage] = useState<string>("");
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [saveSuccessToken, setSaveSuccessToken] = useState<number>(0);
  const saveSuccessTimerRef = useRef<number | null>(null);

  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([createDraftProduct()]);

  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [scrollToResultOnCalcOpen, setScrollToResultOnCalcOpen] = useState<boolean>(false);
  const resultCardRef = useRef<HTMLElement | null>(null);

  function navigateTo(nextScreen: Screen): void {
    setScreenState((current) => {
      if (current === nextScreen) {
        return current;
      }
      backStackRef.current.push(current);
      forwardStackRef.current = [];
      return nextScreen;
    });
  }

  function navigateBack(): void {
    setScreenState((current) => {
      const previous = backStackRef.current.pop();
      if (!previous) {
        return current;
      }
      forwardStackRef.current.push(current);
      return previous;
    });
  }

  function navigateForward(): void {
    setScreenState((current) => {
      const next = forwardStackRef.current.pop();
      if (!next) {
        return current;
      }
      backStackRef.current.push(current);
      return next;
    });
  }

  const archive = useArchive();
  const { replaceArchive } = archive;
  const calc = useCalcEngine();

  useEffect(() => {
    let canceled = false;

    async function loadInitialFiles(): Promise<void> {
      try {
        const [priceResp, archiveResp] = await Promise.all([fetch(PRICE_FILE), fetch(DATA_FILE)]);

        if (!priceResp.ok) {
          throw new Error("Не удалось загрузить price.json");
        }

        const priceJson = (await priceResp.json()) as PriceData;
        if (!canceled) {
          setPriceData(priceJson);
        }

        if (archiveResp.ok) {
          const archiveJson = (await archiveResp.json()) as SavedCalculation[];
          if (!canceled && Array.isArray(archiveJson)) {
            // Важно: не затираем локальный архив данными из data.json.
            const localArchive = readArrayFromStorage<SavedCalculation>(CALCULATIONS_KEY);
            if (localArchive.length === 0) {
              replaceArchive(archiveJson);
            }
          }
        }
      } catch {
        if (!canceled) {
          setPriceData({ categories: [] });
        }
      }
    }

    loadInitialFiles();

    return () => {
      canceled = true;
    };
  }, [replaceArchive]);

  useEffect(() => {
    const localArchive = readArrayFromStorage<SavedCalculation>(CALCULATIONS_KEY);
    const localExtraCategories = readArrayFromStorage<Category>(EXTRA_CATEGORIES_KEY);
    const rawExtraProducts = localStorage.getItem(EXTRA_PRODUCTS_KEY);
    const rawHiddenCategoryIds = localStorage.getItem(HIDDEN_CATEGORY_IDS_KEY);
    const rawHiddenProductIds = localStorage.getItem(HIDDEN_PRODUCT_IDS_KEY);
    const rawPriceOverrides = localStorage.getItem(PRICE_OVERRIDES_KEY);
    const rawCurrencyAbbr = localStorage.getItem(CURRENCY_ABBR_KEY);

    if (localArchive.length > 0) {
      replaceArchive(localArchive);
    }
    if (localExtraCategories.length > 0) {
      setExtraCategories(localExtraCategories);
    }
    if (rawExtraProducts) {
      try {
        const parsed = JSON.parse(rawExtraProducts) as Record<string, Product[]>;
        if (parsed && typeof parsed === "object") {
          setExtraProductsByCategory(parsed);
        }
      } catch {
        setExtraProductsByCategory({});
      }
    }
    if (rawHiddenCategoryIds) {
      try {
        const parsed = JSON.parse(rawHiddenCategoryIds) as string[];
        if (Array.isArray(parsed)) {
          const next = parsed.filter((id) => typeof id === "string" && id !== DELIVERY_CATEGORY_ID);
          setHiddenCategoryIds(next);
          writeToStorage(HIDDEN_CATEGORY_IDS_KEY, next);
        }
      } catch {
        setHiddenCategoryIds([]);
      }
    }
    if (rawHiddenProductIds) {
      try {
        const parsed = JSON.parse(rawHiddenProductIds) as Record<string, string[]>;
        if (parsed && typeof parsed === "object") {
          const next = { ...parsed };
          if (Array.isArray(next[DELIVERY_CATEGORY_ID])) {
            next[DELIVERY_CATEGORY_ID] = next[DELIVERY_CATEGORY_ID].filter(
              (id) => id !== DELIVERY_PRODUCT_ID,
            );
            if (next[DELIVERY_CATEGORY_ID].length === 0) {
              delete next[DELIVERY_CATEGORY_ID];
            }
          }
          setHiddenProductIdsByCategory(next);
          writeToStorage(HIDDEN_PRODUCT_IDS_KEY, next);
        }
      } catch {
        setHiddenProductIdsByCategory({});
      }
    }
    if (rawPriceOverrides) {
      try {
        const parsed = JSON.parse(rawPriceOverrides) as Record<string, number>;
        if (parsed && typeof parsed === "object") {
          setPriceOverrides(parsed);
        }
      } catch {
        setPriceOverrides({});
      }
    }
    if (typeof rawCurrencyAbbr === "string" && rawCurrencyAbbr.trim().length > 0) {
      setCurrencyAbbr(rawCurrencyAbbr.trim());
    }
  }, [replaceArchive]);

  useEffect(() => {
    if (!scrollToResultOnCalcOpen || screen !== "calc" || calc.lines.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollToResultOnCalcOpen(false);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [calc.lines.length, screen, scrollToResultOnCalcOpen]);

  useEffect(() => {
    return () => {
      if (saveSuccessTimerRef.current !== null) {
        window.clearTimeout(saveSuccessTimerRef.current);
      }
    };
  }, []);

  const categories = useMemo(() => {
    const base = [...priceData.categories, ...extraCategories];
    return base
      .filter((category) => !hiddenCategoryIds.includes(category.id))
      .map((category) => ({
        ...category,
        items: [...category.items, ...(extraProductsByCategory[category.id] ?? [])]
          .filter((item) => !(hiddenProductIdsByCategory[category.id] ?? []).includes(item.id))
          .map((item) => {
            const key = buildItemKey(category.id, item.id);
            const overriddenPrice = priceOverrides[key];
            if (!Number.isFinite(overriddenPrice) || overriddenPrice <= 0) {
              return item;
            }
            return { ...item, price: overriddenPrice };
          }),
      }))
      .filter((category) => category.items.length > 0);
  }, [
    priceData.categories,
    extraCategories,
    extraProductsByCategory,
    hiddenCategoryIds,
    hiddenProductIdsByCategory,
    priceOverrides,
  ]);

  const productIndexByName = useMemo(() => {
    const index = new Map<string, { categoryId: string; product: Product }>();
    categories.forEach((category) => {
      category.items.forEach((product) => {
        if (!index.has(product.name)) {
          index.set(product.name, { categoryId: category.id, product });
        }
      });
    });
    return index;
  }, [categories]);

  function updateCurrencyAbbr(nextValue: string): void {
    const normalized = nextValue.trim();
    const safeValue = normalized.length > 0 ? normalized.slice(0, 8) : "грн";
    setCurrencyAbbr(safeValue);
    localStorage.setItem(CURRENCY_ABBR_KEY, safeValue);
    setFormMessage("Валюта обновлена.");
  }

  function handleCalculate(): void {
    const result = calc.handleCalculate(categories);
    setSaveMessage("");
    setCopyMessage("");
    setScrollToResultOnCalcOpen(result.lines.length > 0);
  }

  function triggerSuccessPulse(): void {
    setShowSaveSuccess(true);
    setSaveSuccessToken((prev) => prev + 1);
    if (saveSuccessTimerRef.current !== null) {
      window.clearTimeout(saveSuccessTimerRef.current);
    }
    saveSuccessTimerRef.current = window.setTimeout(() => {
      setShowSaveSuccess(false);
    }, 1000);
  }

  function handleSaveCalculation(): void {
    if (calc.lines.length === 0) {
      setSaveMessage("Сначала нажмите «Рассчитать».");
      return;
    }

    const now = new Date();
    const id = buildIdFromDate(now);
    archive.saveRecord({
      id,
      createdAt: now.toISOString(),
      lines: calc.lines,
      total: calc.total,
    });

    setSaveMessage(`Сохранено в архив: ${id}`);
    triggerSuccessPulse();
  }

  function handleDeleteCalculation(id: string): void {
    archive.deleteRecord(id);
    setArchiveMessage("Запись удалена.");
  }

  function handleEditCalculation(record: SavedCalculation): void {
    const matched = calc.applyArchivedRecord(record, productIndexByName);
    setScrollToResultOnCalcOpen(true);
    navigateTo("calc");

    if (matched > 0) {
      setCopyMessage(`Загружено позиций: ${matched}`);
    } else {
      setCopyMessage("Не удалось сопоставить позиции с текущим прайсом.");
    }
  }

  function isValidCalculationLine(value: unknown): value is CalculationLine {
    if (!value || typeof value !== "object") {
      return false;
    }
    const line = value as Partial<CalculationLine>;
    return (
      typeof line.categoryName === "string" &&
      typeof line.productName === "string" &&
      typeof line.quantity === "number" &&
      Number.isFinite(line.quantity) &&
      line.quantity >= 0 &&
      typeof line.unitPrice === "number" &&
      Number.isFinite(line.unitPrice) &&
      line.unitPrice >= 0 &&
      typeof line.lineTotal === "number" &&
      Number.isFinite(line.lineTotal) &&
      line.lineTotal >= 0
    );
  }

  function normalizeImportedArchive(raw: unknown): SavedCalculation[] {
    const source = Array.isArray(raw)
      ? raw
      : raw &&
          typeof raw === "object" &&
          "calculations" in raw &&
          Array.isArray((raw as { calculations?: unknown }).calculations)
        ? ((raw as { calculations: unknown[] }).calculations ?? [])
        : [];

    const normalized: SavedCalculation[] = [];
    for (const item of source) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as Partial<SavedCalculation>;
      if (typeof record.id !== "string" || typeof record.createdAt !== "string") {
        continue;
      }
      if (typeof record.total !== "number" || !Number.isFinite(record.total) || record.total < 0) {
        continue;
      }
      if (!Array.isArray(record.lines)) {
        continue;
      }
      const lines = record.lines.filter(isValidCalculationLine);
      if (lines.length !== record.lines.length) {
        continue;
      }
      normalized.push({
        id: record.id,
        createdAt: record.createdAt,
        lines,
        total: record.total,
      });
    }

    const deduplicated = Array.from(new Map(normalized.map((record) => [record.id, record])).values());
    return deduplicated.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  function handleExportArchive(): void {
    if (archive.sortedArchive.length === 0) {
      setArchiveMessage("Архив пуст. Экспортировать нечего.");
      return;
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const fileName = `balloon-archive-${y}${m}${d}-${hh}${mm}.json`;

    const payload = {
      version: 1,
      exportedAt: now.toISOString(),
      calculations: archive.sortedArchive,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setArchiveMessage(`Экспортировано записей: ${archive.sortedArchive.length}`);
    triggerSuccessPulse();
  }

  async function handleImportArchiveFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const normalized = normalizeImportedArchive(parsed);

      if (normalized.length === 0) {
        setArchiveMessage("Файл пустой или не подходит по формату архива.");
        return;
      }

      replaceArchive(normalized);
      writeToStorage(CALCULATIONS_KEY, normalized);
      archive.setExpandedArchiveId(null);
      setArchiveMessage(`Восстановлено записей: ${normalized.length}`);
      triggerSuccessPulse();
    } catch {
      setArchiveMessage("Не удалось восстановить архив. Проверьте файл.");
    }
  }

  async function handleCopy(lang: ResultLanguage): Promise<void> {
    if (calc.lines.length === 0) {
      setCopyMessage("Пока нечего копировать.");
      return;
    }

    const totalLabel = lang === "ua" ? "Всього" : "Всего";
    const rows = calc.lines.map((line) => {
      const translatedCategory = translateCategoryName(line.categoryName, lang);
      const translatedProduct = translateProductName(line.productName, lang);
      return `${translatedProduct} (${translatedCategory}) - ${line.quantity} x ${line.unitPrice} = ${line.lineTotal} ${currencyAbbr}`;
    });
    const textToCopy = `${rows.join("\n")}\n${totalLabel}: ${calc.total} ${currencyAbbr}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyMessage("Скопировано в буфер.");
      triggerSuccessPulse();
    } catch {
      setCopyMessage("Не удалось скопировать.");
    }
  }

  function resetCalc(): void {
    calc.resetCalc();
    setSaveMessage("");
    setCopyMessage("");
    setOpenCategoryId(null);
  }

  function saveCategory(): void {
    const cleanedItems = draftProducts
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        price: Number(item.price),
        priceMode: item.priceMode,
      }))
      .filter((item) => {
        if (item.name.length === 0) {
          return false;
        }
        if (item.priceMode === "custom") {
          return true;
        }
        return Number.isFinite(item.price) && item.price > 0;
      });

    if (cleanedItems.length === 0) {
      setFormMessage("Добавьте хотя бы один товар с ценой.");
      return;
    }

    if (targetCategoryId) {
      const targetCategory = categories.find((category) => category.id === targetCategoryId);
      if (!targetCategory) {
        setFormMessage("Выбранная категория не найдена.");
        return;
      }

      const itemsToAdd: Product[] = cleanedItems.map((item, index) => ({
        id: `${item.id}-${Date.now()}-${index}`,
        name: item.name,
        price: item.priceMode === "custom" ? 0 : item.price,
        priceMode: item.priceMode,
      }));

      setExtraProductsByCategory((prev) => {
        const next = {
          ...prev,
          [targetCategoryId]: [...(prev[targetCategoryId] ?? []), ...itemsToAdd],
        };
        writeToStorage(EXTRA_PRODUCTS_KEY, next);
        return next;
      });

      setDraftProducts([createDraftProduct()]);
      setFormMessage(`Товары добавлены в категорию «${targetCategory.name}».`);
      return;
    }

    const categoryName = newCategoryName.trim();

    if (!categoryName) {
      setFormMessage("Введите название категории.");
      return;
    }

    const categoryId = `${categoryName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const newCategory: Category = {
      id: categoryId,
      name: categoryName,
      items: cleanedItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.priceMode === "custom" ? 0 : item.price,
        priceMode: item.priceMode,
      })),
    };

    setExtraCategories((prev) => {
      const next = [...prev, newCategory];
      writeToStorage(EXTRA_CATEGORIES_KEY, next);
      return next;
    });

    setNewCategoryName("");
    setDraftProducts([createDraftProduct()]);
    setFormMessage("Категория добавлена.");
  }

  function deleteExtraCategory(categoryId: string): void {
    setExtraCategories((prev) => {
      const next = prev.filter((category) => category.id !== categoryId);
      writeToStorage(EXTRA_CATEGORIES_KEY, next);
      return next;
    });

    setExtraProductsByCategory((prev) => {
      if (!(categoryId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[categoryId];
      writeToStorage(EXTRA_PRODUCTS_KEY, next);
      return next;
    });

    setHiddenCategoryIds((prev) => {
      if (!prev.includes(categoryId)) {
        return prev;
      }
      const next = prev.filter((id) => id !== categoryId);
      writeToStorage(HIDDEN_CATEGORY_IDS_KEY, next);
      return next;
    });

    setHiddenProductIdsByCategory((prev) => {
      if (!(categoryId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[categoryId];
      writeToStorage(HIDDEN_PRODUCT_IDS_KEY, next);
      return next;
    });

    calc.dropCategorySelections(categoryId);
    setOpenCategoryId((prev) => (prev === categoryId ? null : prev));
    setTargetCategoryId((prev) => (prev === categoryId ? "" : prev));
    setFormMessage("Категория удалена.");
  }

  function deleteCategory(categoryId: string): void {
    const isExtraCategory = extraCategories.some((category) => category.id === categoryId);
    if (isExtraCategory) {
      deleteExtraCategory(categoryId);
      return;
    }

    setHiddenCategoryIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev;
      }
      const next = [...prev, categoryId];
      writeToStorage(HIDDEN_CATEGORY_IDS_KEY, next);
      return next;
    });

    calc.dropCategorySelections(categoryId);
    setOpenCategoryId((prev) => (prev === categoryId ? null : prev));
    setTargetCategoryId((prev) => (prev === categoryId ? "" : prev));
    setFormMessage("Категория удалена.");
  }

  function deleteProduct(categoryId: string, productId: string): void {
    const isExtraCategory = extraCategories.some((category) => category.id === categoryId);
    const existsInExtraProducts = (extraProductsByCategory[categoryId] ?? []).some(
      (product) => product.id === productId,
    );

    if (isExtraCategory) {
      setExtraCategories((prev) => {
        const next = prev.map((category) =>
          category.id === categoryId
            ? { ...category, items: category.items.filter((item) => item.id !== productId) }
            : category,
        );
        writeToStorage(EXTRA_CATEGORIES_KEY, next);
        return next;
      });
    }

    if (existsInExtraProducts) {
      setExtraProductsByCategory((prev) => {
        const current = prev[categoryId] ?? [];
        const updated = current.filter((item) => item.id !== productId);
        const next = { ...prev };
        if (updated.length > 0) {
          next[categoryId] = updated;
        } else {
          delete next[categoryId];
        }
        writeToStorage(EXTRA_PRODUCTS_KEY, next);
        return next;
      });
    } else if (!isExtraCategory) {
      setHiddenProductIdsByCategory((prev) => {
        const current = prev[categoryId] ?? [];
        if (current.includes(productId)) {
          return prev;
        }
        const next = {
          ...prev,
          [categoryId]: [...current, productId],
        };
        writeToStorage(HIDDEN_PRODUCT_IDS_KEY, next);
        return next;
      });
    }

    calc.dropProductSelection(categoryId, productId);
    setFormMessage("Товар удален.");
  }

  function updateProductPrice(categoryId: string, productId: string, nextPrice: number): void {
    const normalizedPrice = Number.isFinite(nextPrice) ? Math.floor(nextPrice) : 0;
    if (normalizedPrice <= 0) {
      setFormMessage("Введите корректную цену.");
      return;
    }

    const extraCategoryHasProduct = extraCategories.some(
      (category) =>
        category.id === categoryId && category.items.some((product) => product.id === productId),
    );
    const extraProductsHaveProduct = (extraProductsByCategory[categoryId] ?? []).some(
      (product) => product.id === productId,
    );

    if (extraCategoryHasProduct) {
      setExtraCategories((prev) => {
        const next = prev.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                items: category.items.map((item) =>
                  item.id === productId ? { ...item, price: normalizedPrice } : item,
                ),
              }
            : category,
        );
        writeToStorage(EXTRA_CATEGORIES_KEY, next);
        return next;
      });
      setFormMessage("Цена обновлена.");
      return;
    }

    if (extraProductsHaveProduct) {
      setExtraProductsByCategory((prev) => {
        const next = {
          ...prev,
          [categoryId]: (prev[categoryId] ?? []).map((item) =>
            item.id === productId ? { ...item, price: normalizedPrice } : item,
          ),
        };
        writeToStorage(EXTRA_PRODUCTS_KEY, next);
        return next;
      });
      setFormMessage("Цена обновлена.");
      return;
    }

    const key = buildItemKey(categoryId, productId);
    setPriceOverrides((prev) => {
      const next = { ...prev, [key]: normalizedPrice };
      writeToStorage(PRICE_OVERRIDES_KEY, next);
      return next;
    });
    setFormMessage("Цена обновлена.");
  }

  return {
    screen,
    setScreen: navigateTo,
    navigateTo,
    navigateBack,
    navigateForward,
    categories,
    openCategoryId,
    setOpenCategoryId,
    quantities: calc.quantities,
    customAmounts: calc.customAmounts,
    setCustomAmounts: calc.setCustomAmounts,
    lines: calc.lines,
    total: calc.total,
    saveMessage,
    showSaveSuccess,
    saveSuccessToken,
    copyMessage,
    archiveMessage,
    currencyAbbr,
    newCategoryName,
    setNewCategoryName,
    targetCategoryId,
    setTargetCategoryId,
    draftProducts,
    setDraftProducts,
    formMessage,
    resultCardRef,
    sortedArchive: archive.sortedArchive,
    expandedArchiveId: archive.expandedArchiveId,
    setExpandedArchiveId: archive.setExpandedArchiveId,
    extraCategories,
    activateItem: calc.activateItem,
    setQuantity: calc.setQuantity,
    handleCalculate,
    handleSaveCalculation,
    handleDeleteCalculation,
    handleEditCalculation,
    handleExportArchive,
    handleImportArchiveFile,
    handleCopy,
    resetCalc,
    saveCategory,
    deleteExtraCategory,
    deleteCategory,
    deleteProduct,
    updateProductPrice,
    updateCurrencyAbbr,
  };
}
