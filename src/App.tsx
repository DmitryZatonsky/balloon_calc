import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { AddCategoryScreen } from "./components/AddCategoryScreen";
import { ArchiveScreen } from "./components/ArchiveScreen";
import { CalcScreen } from "./components/CalcScreen";
import { HomeScreen } from "./components/HomeScreen";
import type {
  Category,
  CalculationLine,
  DraftProduct,
  PriceData,
  Product,
  SavedCalculation,
  Screen,
} from "./types";
import {
  buildIdFromDate,
  buildItemKey,
  createDraftProduct,
  keepDigits,
  readArrayFromStorage,
  writeToStorage,
} from "./utils";

const PRICE_FILE = "/price.json";
const DATA_FILE = "/data.json";
const CALCULATIONS_KEY = "balloon_calc_calculations";
const EXTRA_CATEGORIES_KEY = "balloon_calc_extra_categories";

function App() {
  // Основные данные приложения
  const [screen, setScreen] = useState<Screen>("home");
  const [priceData, setPriceData] = useState<PriceData>({ categories: [] });
  const [extraCategories, setExtraCategories] = useState<Category[]>([]);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);

  // UI-состояния архив/категории
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  // Состояния расчета
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<CalculationLine[]>([]);
  const [total, setTotal] = useState<number>(0);

  // Служебные сообщения и формы
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [formMessage, setFormMessage] = useState<string>("");

  // Форма добавления категории
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([createDraftProduct()]);

  // Якорь к карточке результата
  const [scrollToResultOnCalcOpen, setScrollToResultOnCalcOpen] = useState<boolean>(false);
  const resultCardRef = useRef<HTMLElement | null>(null);

  // Загрузка базового прайса и data.json
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
            setSavedCalculations(archiveJson);
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

  // Локальные данные пользователя (архив и добавленные категории)
  useEffect(() => {
    const localArchive = readArrayFromStorage<SavedCalculation>(CALCULATIONS_KEY);
    const localExtraCategories = readArrayFromStorage<Category>(EXTRA_CATEGORIES_KEY);

    if (localArchive.length > 0) {
      setSavedCalculations(localArchive);
    }
    if (localExtraCategories.length > 0) {
      setExtraCategories(localExtraCategories);
    }
  }, []);

  // Плавная прокрутка к результату после расчета/редактирования
  useEffect(() => {
    if (!scrollToResultOnCalcOpen || screen !== "calc" || lines.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollToResultOnCalcOpen(false);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [lines.length, screen, scrollToResultOnCalcOpen]);

  // Единый список категорий: базовые + пользовательские
  const categories = useMemo(
    () => [...priceData.categories, ...extraCategories],
    [priceData.categories, extraCategories],
  );

  // Архив отсортированный от новых к старым
  const sortedArchive = useMemo(
    () =>
      [...savedCalculations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [savedCalculations],
  );

  // Индекс товаров по названию для быстрого восстановления расчета из архива
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

  // Текст карточки результата для копирования
  const linesForCopy = useMemo(() => {
    if (lines.length === 0) {
      return "";
    }

    const rows = lines.map(
      (line) => `${line.productName} - ${line.quantity} x ${line.unitPrice} = ${line.lineTotal} грн`,
    );

    return `${rows.join("\n")}\nВсего: ${total} грн`;
  }, [lines, total]);

  // Обновляет количество товара и чистит custom-сумму при qty <= 0
  function setQuantity(categoryId: string, productId: string, nextValue: number): void {
    const key = buildItemKey(categoryId, productId);
    const normalized = Number.isFinite(nextValue) ? Math.max(0, Math.floor(nextValue)) : 0;

    setQuantities((prev) => {
      const next = { ...prev };
      if (normalized <= 0) {
        delete next[key];
      } else {
        next[key] = normalized;
      }
      return next;
    });

    if (normalized <= 0) {
      setCustomAmounts((prev) => {
        if (!(key in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  // Активирует товар по нажатию "+"
  function activateItem(categoryId: string, product: Product): void {
    const key = buildItemKey(categoryId, product.id);
    setQuantity(categoryId, product.id, 1);

    if (product.priceMode === "custom") {
      setCustomAmounts((prev) => {
        if (key in prev) {
          return prev;
        }
        return { ...prev, [key]: "" };
      });
    }
  }

  // Строит массив строк результата и общую сумму
  function buildCalculation(): { lines: CalculationLine[]; total: number } {
    const nextLines: CalculationLine[] = [];
    let nextTotal = 0;

    for (const category of categories) {
      for (const product of category.items) {
        const key = buildItemKey(category.id, product.id);
        const qty = quantities[key] ?? 0;
        if (qty <= 0) {
          continue;
        }

        const isCustom = product.priceMode === "custom";
        const customPrice = Number(customAmounts[key] ?? 0);
        const normalizedQty = isCustom ? 1 : qty;
        const unitPrice = isCustom ? customPrice : product.price;

        if (unitPrice <= 0) {
          continue;
        }

        const lineTotal = normalizedQty * unitPrice;
        nextTotal += lineTotal;

        nextLines.push({
          categoryName: category.name,
          productName: product.name,
          quantity: normalizedQty,
          unitPrice,
          lineTotal,
        });
      }
    }

    return { lines: nextLines, total: nextTotal };
  }

  // Запускает расчет и показывает карточку результата
  function handleCalculate(): void {
    const result = buildCalculation();
    setLines(result.lines);
    setTotal(result.total);
    setSaveMessage("");
    setCopyMessage("");
    setScrollToResultOnCalcOpen(result.lines.length > 0);
  }

  // Сохраняет текущий результат в архив
  function handleSaveCalculation(): void {
    if (lines.length === 0) {
      setSaveMessage("Сначала нажмите «Рассчитать».");
      return;
    }

    const now = new Date();
    const record: SavedCalculation = {
      id: buildIdFromDate(now),
      createdAt: now.toISOString(),
      lines,
      total,
    };

    setSavedCalculations((prev) => {
      const next = [record, ...prev];
      writeToStorage(CALCULATIONS_KEY, next);
      return next;
    });

    setSaveMessage(`Сохранено в архив: ${record.id}`);
  }

  // Удаляет расчет из архива по id
  function handleDeleteCalculation(id: string): void {
    setSavedCalculations((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeToStorage(CALCULATIONS_KEY, next);
      return next;
    });

    setExpandedArchiveId((prev) => (prev === id ? null : prev));
  }

  // Загружает сохраненный расчет обратно в экран "Категории"
  function handleEditCalculation(record: SavedCalculation): void {
    const nextQuantities: Record<string, number> = {};
    const nextCustomAmounts: Record<string, string> = {};
    let matched = 0;

    for (const line of record.lines) {
      const found = productIndexByName.get(line.productName);
      if (!found) {
        continue;
      }

      const key = buildItemKey(found.categoryId, found.product.id);
      if (found.product.priceMode === "custom") {
        nextQuantities[key] = 1;
        nextCustomAmounts[key] = String(line.unitPrice);
      } else {
        nextQuantities[key] = line.quantity;
      }
      matched += 1;
    }

    setQuantities(nextQuantities);
    setCustomAmounts(nextCustomAmounts);
    setLines(record.lines);
    setTotal(record.total);
    setScrollToResultOnCalcOpen(true);
    setScreen("calc");

    if (matched > 0) {
      setCopyMessage(`Загружено позиций: ${matched}`);
    } else {
      setCopyMessage("Не удалось сопоставить позиции с текущим прайсом.");
    }
  }

  // Копирует текущую карточку результата в буфер обмена
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

  // Сбрасывает текущий расчет
  function resetCalc(): void {
    setQuantities({});
    setCustomAmounts({});
    setLines([]);
    setTotal(0);
    setSaveMessage("");
    setCopyMessage("");
    setOpenCategoryId(null);
  }

  // Сохраняет новую пользовательскую категорию
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

  // Удаляет пользовательскую категорию и связанные выбранные значения
  function deleteExtraCategory(categoryId: string): void {
    setExtraCategories((prev) => {
      const next = prev.filter((category) => category.id !== categoryId);
      writeToStorage(EXTRA_CATEGORIES_KEY, next);
      return next;
    });

    setQuantities((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${categoryId}::`))),
    );
    setCustomAmounts((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${categoryId}::`))),
    );

    setOpenCategoryId((prev) => (prev === categoryId ? null : prev));
    setFormMessage("Категория удалена.");
  }

  // Рендерит общий заголовок экрана с кнопкой "Назад"
  function renderHeader(title: string) {
    return (
      <header className="screen-header">
        <button
          className="ghost-btn"
          onClick={() => setScreen("home")}
          aria-label="Назад"
          title="Назад"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2>{title}</h2>
        <span className="header-spacer" aria-hidden="true" />
      </header>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-card">
        {screen === "home" && <HomeScreen setScreen={setScreen} />}

        {screen === "calc" && (
          <CalcScreen
            categories={categories}
            openCategoryId={openCategoryId}
            setOpenCategoryId={setOpenCategoryId}
            quantities={quantities}
            customAmounts={customAmounts}
            buildItemKey={buildItemKey}
            activateItem={activateItem}
            setQuantity={setQuantity}
            setCustomAmounts={setCustomAmounts}
            keepDigits={keepDigits}
            handleCalculate={handleCalculate}
            resetCalc={resetCalc}
            lines={lines}
            total={total}
            handleCopy={handleCopy}
            handleSaveCalculation={handleSaveCalculation}
            saveMessage={saveMessage}
            copyMessage={copyMessage}
            resultCardRef={resultCardRef}
            renderHeader={renderHeader}
          />
        )}

        {screen === "archive" && (
          <ArchiveScreen
            sortedArchive={sortedArchive}
            expandedArchiveId={expandedArchiveId}
            setExpandedArchiveId={setExpandedArchiveId}
            handleEditCalculation={handleEditCalculation}
            handleDeleteCalculation={handleDeleteCalculation}
            renderHeader={renderHeader}
          />
        )}

        {screen === "add" && (
          <AddCategoryScreen
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            draftProducts={draftProducts}
            setDraftProducts={setDraftProducts}
            saveCategory={saveCategory}
            formMessage={formMessage}
            extraCategories={extraCategories}
            deleteExtraCategory={deleteExtraCategory}
            renderHeader={renderHeader}
          />
        )}
      </div>
    </div>
  );
}

export default App;
