import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, DraftProduct, PriceData, Product, SavedCalculation, Screen } from "../types";
import { buildIdFromDate, createDraftProduct, readArrayFromStorage, writeToStorage } from "../utils";
import { useArchive } from "./useArchive";
import { useCalcEngine } from "./useCalcEngine";

const PRICE_FILE = "/price.json";
const DATA_FILE = "/data.json";
const CALCULATIONS_KEY = "balloon_calc_calculations";
const EXTRA_CATEGORIES_KEY = "balloon_calc_extra_categories";

export function useBalloonCalc() {
  const [screen, setScreenState] = useState<Screen>("home");
  const backStackRef = useRef<Screen[]>([]);
  const forwardStackRef = useRef<Screen[]>([]);
  const [priceData, setPriceData] = useState<PriceData>({ categories: [] });
  const [extraCategories, setExtraCategories] = useState<Category[]>([]);

  const [saveMessage, setSaveMessage] = useState<string>("");
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [formMessage, setFormMessage] = useState<string>("");

  const [newCategoryName, setNewCategoryName] = useState<string>("");
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
              archive.replaceArchive(archiveJson);
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
  }, []);

  useEffect(() => {
    const localArchive = readArrayFromStorage<SavedCalculation>(CALCULATIONS_KEY);
    const localExtraCategories = readArrayFromStorage<Category>(EXTRA_CATEGORIES_KEY);

    if (localArchive.length > 0) {
      archive.replaceArchive(localArchive);
    }
    if (localExtraCategories.length > 0) {
      setExtraCategories(localExtraCategories);
    }
  }, []);

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

  const categories = useMemo(
    () => [...priceData.categories, ...extraCategories],
    [priceData.categories, extraCategories],
  );

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

  const linesForCopy = useMemo(() => {
    if (calc.lines.length === 0) {
      return "";
    }

    const rows = calc.lines.map(
      (line) =>
        `${line.productName} - ${line.quantity} x ${line.unitPrice} = ${line.lineTotal} грн`,
    );

    return `${rows.join("\n")}\nВсего: ${calc.total} грн`;
  }, [calc.lines, calc.total]);

  function handleCalculate(): void {
    const result = calc.handleCalculate(categories);
    setSaveMessage("");
    setCopyMessage("");
    setScrollToResultOnCalcOpen(result.lines.length > 0);
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
  }

  function handleDeleteCalculation(id: string): void {
    archive.deleteRecord(id);
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

  async function handleCopy(): Promise<void> {
    if (!linesForCopy) {
      setCopyMessage("Пока нечего копировать.");
      return;
    }

    try {
      await navigator.clipboard.writeText(linesForCopy);
      setCopyMessage("Скопировано в буфер.");
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
    const categoryName = newCategoryName.trim();

    if (!categoryName) {
      setFormMessage("Введите название категории.");
      return;
    }

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

    calc.dropCategorySelections(categoryId);
    setOpenCategoryId((prev) => (prev === categoryId ? null : prev));
    setFormMessage("Категория удалена.");
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
    copyMessage,
    newCategoryName,
    setNewCategoryName,
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
    handleCopy,
    resetCalc,
    saveCategory,
    deleteExtraCategory,
  };
}
