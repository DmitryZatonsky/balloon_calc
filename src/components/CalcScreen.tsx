import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Category, CalculationLine, Product } from "../types";
import { formatMoney } from "../utils";

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
  handleCopy: () => Promise<void>;
  handleSaveCalculation: () => void;
  saveMessage: string;
  copyMessage: string;
  resultCardRef: RefObject<HTMLElement | null>;
  renderHeader: (title: string) => React.ReactNode;
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
  handleCopy,
  handleSaveCalculation,
  saveMessage,
  copyMessage,
  resultCardRef,
  renderHeader,
}: Props) {
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
                <span>{category.name}</span>
              </button>

              <div className={`products ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
                {category.items.map((product) => {
                  const key = buildItemKey(category.id, product.id);
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
                        <button className="qty-add" onClick={() => activateItem(category.id, product)}>
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
            <h3>Результат</h3>
            <button
              className="ui-icon-btn copy-icon-btn"
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
                <span className="line-label">
                  <span>{line.productName}</span>
                  <span className="line-category">{line.categoryName}</span>
                </span>
                <span className="line-meta">
                  <span className="line-qty">x {line.quantity}</span>
                  <strong>{formatMoney(line.lineTotal)}</strong>
                </span>
              </li>
            ))}
          </ul>

          <div className="total-row">
            <span>Всего</span>
            <strong>{formatMoney(total)}</strong>
          </div>

          <button className="ui-btn ui-btn--primary main-btn save-btn" onClick={handleSaveCalculation}>
            Сохранить
          </button>
        </article>
      )}

      {saveMessage && <p className="status">{saveMessage}</p>}
      {copyMessage && <p className="status">{copyMessage}</p>}
    </section>
  );
}
