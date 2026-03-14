import { useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type {
  Category,
  CalculationLine,
  CustomFigureRow,
  Product,
  ResultLanguage,
} from "../types";
import { formatMoney, translateCategoryName, translateProductName, getProducts } from "../utils";
import { CategoryIcon } from "./CategoryIcon";

type Props = {
  categories: Category[];
  openCategoryId: string | null;
  setOpenCategoryId: (id: string | null) => void;
  quantities: Record<string, number>;
  customAmounts: Record<string, string>;
  buildItemKey: (categoryId: string, productId: string) => string;
  activateItem: (categoryId: string, product: Product) => void;
  setQuantity: (categoryId: string, productId: string, nextValue: number) => void;
  setCustomAmounts: Dispatch<SetStateAction<Record<string, string>>>;
  keepDigits: (value: string) => string;
  handleCalculate: () => void;
  resetCalc: () => void;
  lines: CalculationLine[];
  total: number;
  currencyAbbr: string;
  handleCopy: (lang: ResultLanguage) => Promise<void>;
  handleSaveCalculation: () => void;
  saveMessage: string;
  copyMessage: string;
  resultCardRef: RefObject<HTMLElement | null>;
  renderHeader: (title: string) => React.ReactNode;
  customFigureRows: CustomFigureRow[];
  addCustomFigureRow: () => void;
  updateCustomFigureRow: (id: string, changes: Partial<CustomFigureRow>) => void;
  removeCustomFigureRow: (id: string) => void;
};

export function CalcScreen({
  categories,
  openCategoryId,
  setOpenCategoryId,
  quantities,
  customAmounts,
  buildItemKey,
  activateItem,
  setQuantity,
  setCustomAmounts,
  keepDigits,
  handleCalculate,
  resetCalc,
  lines,
  total,
  currencyAbbr,
  handleCopy,
  handleSaveCalculation,
  saveMessage,
  copyMessage,
  resultCardRef,
  renderHeader,
  customFigureRows,
  addCustomFigureRow,
  updateCustomFigureRow,
  removeCustomFigureRow,
}: Props) {
  const [resultLang, setResultLang] = useState<ResultLanguage>("ru");

  const resultTitle = resultLang === "ua" ? "Результат" : "Результат";
  const totalLabel = resultLang === "ua" ? "Всього" : "Всего";
  const saveLabel = resultLang === "ua" ? "Зберегти" : "Сохранить";

  return (
    <section className="screen calc">
      {renderHeader("Категории")}
      <div className="category-list">
        {categories.map((category) => {
          const isOpen = openCategoryId === category.id;
          return (
            <article key={category.id} className={`category-card ${isOpen ? "is-open" : ""}`}>
              <button
                className="ui-btn ui-btn--ghost category-btn"
                onClick={() => setOpenCategoryId(isOpen ? null : category.id)}
              >
                <span className="category-btn__content">
                  <CategoryIcon
                    categoryId={category.id}
                    categoryName={category.name}
                    className="category-btn__icon"
                  />
                  <span className="category-btn__label">{category.name}</span>
                </span>
              </button>

              <div className={`products ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
                {category.id === "figures" && isOpen && (
                  <div className="product-row">
                    <span>Добавить фигуру</span>
                    <button
                      type="button"
                      className="ui-btn ui-btn--ghost ghost-btn qty-btn"
                      onClick={addCustomFigureRow}
                    >
                      +
                    </button>
                  </div>
                )}
                {getProducts(category)
                  .filter((product) => product.id !== "fig-custom")
                  .map((product) => {
                  const key = buildItemKey(category.id, product.id);
                  const qty = quantities[key] ?? 0;

// {console.log(category.id);}
// {console.log(quantities[key]);}
console.log(categories)
                  return (
                    <div key={product.id} className="product-row">
                      <div className="product-info">
                        <strong>{product.name}</strong>
                        <span>
                          {product.priceMode === "custom"
                            ? "Введите сумму"
                            : formatMoney(product.price, currencyAbbr)}
                        </span>
                      </div>

                      {qty <= 0 ? (
                        <button className="qty-btn" onClick={() => activateItem(category.id, product)}>
                          +
                        </button>
                      ) : (
                        <div className="qty-control">
                          {product.priceMode === "custom" ? (
                            <input
                              className="ui-input custom-amount-input"
                              inputMode="numeric"
                              placeholder="Сумма"
                              value={customAmounts[key] ?? ""}
                              onChange={(event) =>
                                setCustomAmounts((prev) => ({
                                  ...prev,
                                  [key]: keepDigits(event.target.value),
                                }))
                              }
                            />
                          ) : (
                            <>
                              <button
                                className="qty-btn"
                                onClick={() => setQuantity(category.id, product.id, qty - 1)}
                              >
                                −
                              </button>
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
                {category.id === "figures" && isOpen && (
                  <div className="product-rows">
                    {customFigureRows.map((row) => (
                      <div key={row.id} className="product-row">
                        <input
                          className="ui-input custom-product-input"
                          placeholder="Бетмен"
                          value={row.name}
                          onChange={(event) =>
                            updateCustomFigureRow(row.id, { name: event.target.value })
                          }
                        />
                        <input
                          className="ui-input custom-amount-input"
                          placeholder="0"
                          inputMode="numeric"
                          value={row.price}
                          onChange={(event) =>
                            updateCustomFigureRow(row.id, {
                              price: keepDigits(event.target.value),
                            })
                          }
                        />
                        <button
                          type="button"
                          className="ui-btn ui-btn--ghost ghost-btn qty-btn"
                          onClick={() => removeCustomFigureRow(row.id)}
                        >
                          -
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="calc-actions">
        <button className="ui-btn ui-btn--primary main-btn" onClick={handleCalculate}>
          Рассчитать
        </button>
        <button className="ui-btn ui-btn--ghost ghost-btn" onClick={resetCalc}>
          Сбросить
        </button>
      </div>

      {lines.length > 0 && (
        <article className="result-card" ref={resultCardRef}>
          <div className="result-head">
            <h3>{resultTitle}</h3>
            <div className="result-head-actions">
              <button
                className="ui-icon-btn result-lang-btn"
                onClick={() => setResultLang((prev) => (prev === "ru" ? "ua" : "ru"))}
                aria-label="Переключить язык карточки результата"
                title={resultLang === "ru" ? "Українська" : "Русский"}
              >
                {resultLang === "ru" ? "UA" : "RU"}
              </button>
              <button
                className="ui-icon-btn copy-icon-btn"
                onClick={() => handleCopy(resultLang)}
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
          </div>

          <ul>
            {lines.map((line, index) => (
              <li key={`${line.productName}-${index}`}>
                <span className="line-label">
                  <span>{translateProductName(line.productName, resultLang)}</span>
                  <span className="line-category">
                    {translateCategoryName(line.categoryName, resultLang)}
                  </span>
                </span>
                <span className="line-meta">
                  <span className="line-qty">x {line.quantity}</span>
                  <strong>{formatMoney(line.lineTotal, currencyAbbr)}</strong>
                </span>
              </li>
            ))}
          </ul>

          <div className="total-row">
            <span>{totalLabel}</span>
            <strong>{formatMoney(total, currencyAbbr)}</strong>
          </div>

          <button className="ui-btn ui-btn--primary main-btn save-btn" onClick={handleSaveCalculation}>
            {saveLabel}
          </button>
        </article>
      )}

      {saveMessage && <p className="status">{saveMessage}</p>}
      {copyMessage && <p className="status">{copyMessage}</p>}
    </section>
  );
}
