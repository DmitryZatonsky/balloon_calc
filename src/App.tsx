import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Product = {
  id: string;
  name: string;
  price: number;
  priceMode?: "fixed" | "custom";
};

type Category = {
  id: string;
  name: string;
  items: Product[];
};

type PriceData = {
  categories: Category[];
};

type CalculationLine = {
  categoryName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type SavedCalculation = {
  id: string;
  createdAt: string;
  lines: CalculationLine[];
  total: number;
};

type Screen = "home" | "calc" | "archive" | "add";

type DraftProduct = {
  id: string;
  name: string;
  price: string;
  priceMode: "fixed" | "custom";
};

const PRICE_FILE = "/price.json";
const DATA_FILE = "/data.json";
const CALCULATIONS_KEY = "balloon_calc_calculations";
const EXTRA_CATEGORIES_KEY = "balloon_calc_extra_categories";

function formatMoney(value: number): string {
  return `${value.toLocaleString("ru-RU")} грн`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function buildIdFromDate(date: Date): string {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = String(date.getFullYear()).slice(-2);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}${month}${year}-${hours}${minutes}`;
}

function createDraftProduct(): DraftProduct {
  return { id: crypto.randomUUID(), name: "", price: "", priceMode: "fixed" };
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [priceData, setPriceData] = useState<PriceData>({ categories: [] });
  const [extraCategories, setExtraCategories] = useState<Category[]>([]);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<CalculationLine[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([createDraftProduct()]);
  const [formMessage, setFormMessage] = useState<string>("");
  const [scrollToResultOnCalcOpen, setScrollToResultOnCalcOpen] = useState<boolean>(false);
  const resultCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let canceled = false;

    async function loadData(): Promise<void> {
      try {
        const [priceResp, archiveResp] = await Promise.all([
          fetch(PRICE_FILE),
          fetch(DATA_FILE),
        ]);

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

    loadData();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const rawArchive = localStorage.getItem(CALCULATIONS_KEY);
    const rawExtra = localStorage.getItem(EXTRA_CATEGORIES_KEY);

    if (rawArchive) {
      try {
        const parsedArchive = JSON.parse(rawArchive) as SavedCalculation[];
        if (Array.isArray(parsedArchive)) {
          setSavedCalculations(parsedArchive);
        }
      } catch {
        // keep defaults
      }
    }

    if (rawExtra) {
      try {
        const parsedExtra = JSON.parse(rawExtra) as Category[];
        if (Array.isArray(parsedExtra)) {
          setExtraCategories(parsedExtra);
        }
      } catch {
        // keep defaults
      }
    }
  }, []);

  useEffect(() => {
    if (!scrollToResultOnCalcOpen) {
      return;
    }
    if (screen !== "calc") {
      return;
    }
    if (lines.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      resultCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setScrollToResultOnCalcOpen(false);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [lines.length, screen, scrollToResultOnCalcOpen]);

  const categories = useMemo(
    () => [...priceData.categories, ...extraCategories],
    [extraCategories, priceData.categories],
  );

  const sortedArchive = useMemo(
    () =>
      [...savedCalculations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [savedCalculations],
  );

  const linesForCopy = useMemo(() => {
    if (lines.length === 0) {
      return "";
    }

    const rows = lines.map(
      (line) => `${line.productName} - ${line.quantity} x ${line.unitPrice} = ${line.lineTotal} грн`,
    );

    return `${rows.join("\n")}\nВсего: ${total} грн`;
  }, [lines, total]);

  function itemKey(categoryId: string, productId: string): string {
    return `${categoryId}::${productId}`;
  }

  function setQuantity(categoryId: string, productId: string, nextValue: number): void {
    const key = itemKey(categoryId, productId);
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

  function activateItem(categoryId: string, product: Product): void {
    const key = itemKey(categoryId, product.id);
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

  function buildCalculation(): { lines: CalculationLine[]; total: number } {
    const nextLines: CalculationLine[] = [];
    let nextTotal = 0;

    categories.forEach((category) => {
      category.items.forEach((product) => {
        const key = itemKey(category.id, product.id);
        const qty = quantities[key] ?? 0;
        if (qty <= 0) {
          return;
        }

        const isCustom = product.priceMode === "custom";
        const customPrice = Number(customAmounts[key] ?? 0);
        const normalizedQty = isCustom ? 1 : qty;
        const unitPrice = isCustom ? customPrice : product.price;

        if (unitPrice <= 0) {
          return;
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
      });
    });

    return { lines: nextLines, total: nextTotal };
  }

  function handleCalculate(): void {
    const result = buildCalculation();
    setLines(result.lines);
    setTotal(result.total);
    setSaveMessage("");
  }

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
      localStorage.setItem(CALCULATIONS_KEY, JSON.stringify(next));
      return next;
    });
    setSaveMessage(`Сохранено в архив: ${record.id}`);
  }

  function handleDeleteCalculation(id: string): void {
    setSavedCalculations((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(CALCULATIONS_KEY, JSON.stringify(next));
      return next;
    });
    setExpandedArchiveId((prev) => (prev === id ? null : prev));
  }

  function handleEditCalculation(record: SavedCalculation): void {
    const nextQuantities: Record<string, number> = {};
    const nextCustomAmounts: Record<string, string> = {};
    let matched = 0;

    record.lines.forEach((line) => {
      for (const category of categories) {
        const product = category.items.find((item) => item.name === line.productName);
        if (!product) {
          continue;
        }

        const key = itemKey(category.id, product.id);
        if (product.priceMode === "custom") {
          nextQuantities[key] = 1;
          nextCustomAmounts[key] = String(line.unitPrice);
        } else {
          nextQuantities[key] = line.quantity;
        }
        matched += 1;
        break;
      }
    });

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
    setQuantities({});
    setCustomAmounts({});
    setLines([]);
    setTotal(0);
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
      localStorage.setItem(EXTRA_CATEGORIES_KEY, JSON.stringify(next));
      return next;
    });

    setNewCategoryName("");
    setDraftProducts([createDraftProduct()]);
    setFormMessage("Категория добавлена.");
  }

  function deleteExtraCategory(categoryId: string): void {
    setExtraCategories((prev) => {
      const next = prev.filter((category) => category.id !== categoryId);
      localStorage.setItem(EXTRA_CATEGORIES_KEY, JSON.stringify(next));
      return next;
    });

    setQuantities((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => !key.startsWith(`${categoryId}::`)),
      ),
    );
    setCustomAmounts((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => !key.startsWith(`${categoryId}::`)),
      ),
    );
    setOpenCategoryId((prev) => (prev === categoryId ? null : prev));
    setFormMessage("Категория удалена.");
  }

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
        {screen === "home" && (
          <section className="screen home">
            <div className="hero-panel">
              <p className="subtitle">Карманный PWA-калькулятор для расчета заказа шариков.</p>
            </div>
            <div className="menu-grid">
              <button className="menu-card menu-card--lavender" onClick={() => setScreen("calc")}>
                <div className="menu-card__head">
                  <span className="menu-card__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        d="M5 4h14v16H5zM8 8h8M8 12h5M8 16h8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="menu-card__text">
                    <span className="menu-card__title">Рассчитать стоимость</span>
                    <span className="menu-card__desc">Подсчет количества и общей суммы</span>
                  </div>
                </div>
              </button>
              <button className="menu-card menu-card--sand" onClick={() => setScreen("archive")}>
                <div className="menu-card__head">
                  <span className="menu-card__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        d="M4 7h16v13H4zM8 4h8M9 11h6M9 15h6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="menu-card__text">
                    <span className="menu-card__title">Архив</span>
                    <span className="menu-card__desc">Сохраненные расчеты на устройстве</span>
                  </div>
                </div>
              </button>
              <button className="menu-card menu-card--mint" onClick={() => setScreen("add")}>
                <div className="menu-card__head">
                  <span className="menu-card__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        d="M12 5v14M5 12h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="menu-card__text">
                    <span className="menu-card__title">Добавить наименование</span>
                    <span className="menu-card__desc">Новая категория и товары</span>
                  </div>
                </div>
              </button>
            </div>
            <p className="small-note">Сохранения хранятся локально на этом устройстве.</p>
          </section>
        )}

        {screen === "calc" && (
          <section className="screen calc">
            {renderHeader("Категории")}

            <div className="category-list">
              {categories.map((category) => {
                const isOpen = openCategoryId === category.id;
                return (
                  <article
                    key={category.id}
                    className={`category-card ${isOpen ? "is-open" : ""}`}
                  >
                    <button
                      className="category-btn"
                      onClick={() => setOpenCategoryId(isOpen ? null : category.id)}
                    >
                      <span>{category.name}</span>
                    </button>

                    <div className={`products ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
                      {category.items.map((product) => {
                        const key = itemKey(category.id, product.id);
                        const qty = quantities[key] ?? 0;

                        return (
                          <div key={product.id} className="product-row">
                            <div className="product-info">
                              <strong>{product.name}</strong>
                              <span>
                                {product.priceMode === "custom"
                                  ? "Введите сумму"
                                  : formatMoney(product.price)}
                              </span>
                            </div>

                            {qty <= 0 ? (
                              <button
                                className="qty-add"
                                onClick={() => activateItem(category.id, product)}
                              >
                                +
                              </button>
                            ) : (
                              <div className="qty-control">
                                <button
                                  className="qty-btn"
                                  onClick={() => setQuantity(category.id, product.id, qty - 1)}
                                >
                                  −
                                </button>

                                {product.priceMode === "custom" ? (
                                  <input
                                    className="custom-amount-input"
                                    inputMode="numeric"
                                    placeholder="Сумма"
                                    value={customAmounts[key] ?? ""}
                                    onChange={(event) =>
                                      setCustomAmounts((prev) => ({
                                        ...prev,
                                        [key]: event.target.value.replace(/[^\d]/g, ""),
                                      }))
                                    }
                                  />
                                ) : (
                                  <>
                                    <span className="qty-value">{qty}</span>
                                    <button
                                      className="qty-btn"
                                      onClick={() => setQuantity(category.id, product.id, qty + 1)}
                                    >
                                      +
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="calc-actions">
              <button className="main-btn" onClick={handleCalculate}>
                Рассчитать
              </button>
              <button className="ghost-btn" onClick={resetCalc}>
                Сбросить
              </button>
            </div>

            {lines.length > 0 && (
              <article className="result-card" ref={resultCardRef}>
                <div className="result-head">
                  <h3>Результат</h3>
                  <button
                    className="copy-icon-btn"
                    onClick={handleCopy}
                    aria-label="Скопировать расчет"
                    title="Скопировать"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path
                        d="M9 9h10v12H9zM5 3h10v2H7v10H5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <ul>
                  {lines.map((line, index) => (
                    <li key={`${line.productName}-${index}`}>
                      <span>
                        {line.productName} x {line.quantity}
                      </span>
                      <strong>{formatMoney(line.lineTotal)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="total-row">
                  <span>Всего</span>
                  <strong>{formatMoney(total)}</strong>
                </div>
                <button className="main-btn save-btn" onClick={handleSaveCalculation}>
                  Сохранить
                </button>
              </article>
            )}

            {saveMessage && <p className="status">{saveMessage}</p>}
            {copyMessage && <p className="status">{copyMessage}</p>}
          </section>
        )}

        {screen === "archive" && (
          <section className="screen archive">
            {renderHeader("Архив")}

            {sortedArchive.length === 0 ? (
              <p className="empty">Пока нет сохраненных расчетов.</p>
            ) : (
              <div className="archive-list">
                {sortedArchive.map((record) => {
                  const isExpanded = expandedArchiveId === record.id;
                  return (
                  <article
                    key={record.id}
                    className={`archive-card ${isExpanded ? "is-expanded" : ""}`}
                    onClick={() =>
                      setExpandedArchiveId((prev) => (prev === record.id ? null : record.id))
                    }
                  >
                    <div className="archive-top">
                      <div className="archive-meta">
                        <strong>{new Date(record.createdAt).toLocaleString("ru-RU")}</strong>
                        <span>{formatMoney(record.total)}</span>
                      </div>
                      <div className="archive-actions">
                        <button
                          className="icon-action-btn"
                          aria-label="Редактировать расчет"
                          title="Редактировать"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditCalculation(record);
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                              d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="icon-action-btn danger"
                          aria-label="Удалить расчет"
                          title="Удалить"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteCalculation(record.id);
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                              d="M7 7l10 10M17 7L7 17"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        <ul>
                          {record.lines.map((line, index) => (
                            <li key={`${record.id}-${line.productName}-${index}`}>
                              {line.productName} x {line.quantity} = {line.lineTotal} грн
                            </li>
                          ))}
                        </ul>
                        <div className="total-row">
                          <span>Всего</span>
                          <strong>{formatMoney(record.total)}</strong>
                        </div>
                      </>
                    )}
                  </article>
                )})}
              </div>
            )}
          </section>
        )}

        {screen === "add" && (
          <section className="screen add">
            {renderHeader("Добавить категорию")}

            <label className="field">
              <span>Название категории</span>
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Например: Фольга"
              />
            </label>

            <div className="draft-products">
              {draftProducts.map((item, index) => (
                <div key={item.id} className="draft-row">
                  <input
                    className="draft-name"
                    value={item.name}
                    placeholder="Название товара"
                    onChange={(event) =>
                      setDraftProducts((prev) =>
                        prev.map((current) =>
                          current.id === item.id ? { ...current, name: event.target.value } : current,
                        ),
                      )
                    }
                  />
                  <input
                    className="draft-price"
                    value={item.price}
                    placeholder={item.priceMode === "custom" ? "Сумма при расчете" : "Цена"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={item.priceMode === "custom"}
                    onChange={(event) =>
                      setDraftProducts((prev) =>
                        prev.map((current) =>
                          current.id === item.id
                            ? {
                                ...current,
                                price: event.target.value.replace(/[^\d]/g, ""),
                              }
                            : current,
                        ),
                      )
                    }
                  />
                  <label className="price-mode-toggle">
                    <input
                      type="checkbox"
                      checked={item.priceMode === "custom"}
                      onChange={(event) =>
                        setDraftProducts((prev) =>
                          prev.map((current) =>
                            current.id === item.id
                              ? {
                                  ...current,
                                  priceMode: event.target.checked ? "custom" : "fixed",
                                  price: event.target.checked ? "" : current.price,
                                }
                              : current,
                          ),
                        )
                      }
                    />
                    Свободная цена
                  </label>
                  {index === draftProducts.length - 1 && (
                    <button
                      className="ghost-btn"
                      onClick={saveCategory}
                    >
                      Сохранить категорию
                    </button>
                  )}
                </div>
              ))}
            </div>

            {formMessage && <p className="status">{formMessage}</p>}

            {extraCategories.length > 0 && (
              <div className="user-categories">
                <h3>Мои категории</h3>
                <div className="user-categories-list">
                  {extraCategories.map((category) => (
                    <div key={category.id} className="user-category-row">
                      <span>
                        {category.name} ({category.items.length})
                      </span>
                      <button
                        className="icon-action-btn danger"
                        onClick={() => deleteExtraCategory(category.id)}
                        aria-label={`Удалить категорию ${category.name}`}
                        title="Удалить категорию"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <path
                            d="M7 7l10 10M17 7L7 17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
