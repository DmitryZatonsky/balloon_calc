import { useState } from "react";
import type { Category } from "../types";
import { keepDigits } from "../utils";

type Props = {
  categories: Category[];
  currencyAbbr: string;
  deleteCategory: (categoryId: string) => void;
  deleteProduct: (categoryId: string, productId: string) => void;
  updateProductPrice: (categoryId: string, productId: string, nextPrice: number) => void;
};

export function PriceManagerPanel({
  categories,
  currencyAbbr,
  deleteCategory,
  deleteProduct,
  updateProductPrice,
}: Props) {
  const [openManagedCategoryId, setOpenManagedCategoryId] = useState<string | null>(null);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<
    | {
        kind: "category";
        categoryId: string;
        label: string;
      }
    | {
        kind: "product";
        categoryId: string;
        productId: string;
        label: string;
      }
    | null
  >(null);

  function toggleManagedCategory(categoryId: string): void {
    setOpenManagedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  }

  function getPriceKey(categoryId: string, productId: string): string {
    return `${categoryId}::${productId}`;
  }

  function getDraftPrice(categoryId: string, productId: string, currentPrice: number): string {
    const key = getPriceKey(categoryId, productId);
    return draftPrices[key] ?? String(currentPrice);
  }

  function updateDraftPrice(categoryId: string, productId: string, nextValue: string): void {
    const key = getPriceKey(categoryId, productId);
    setDraftPrices((prev) => ({ ...prev, [key]: keepDigits(nextValue) }));
  }

  function handlePriceBlur(categoryId: string, productId: string, currentPrice: number): void {
    const key = getPriceKey(categoryId, productId);
    const rawDraft = draftPrices[key];
    if (rawDraft === undefined) {
      return;
    }

    const nextPrice = Number(rawDraft);
    if (Number.isFinite(nextPrice) && nextPrice > 0 && nextPrice !== currentPrice) {
      updateProductPrice(categoryId, productId, nextPrice);
    }

    setDraftPrices((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function requestDeleteCategory(categoryId: string, categoryName: string): void {
    setPendingDelete({
      kind: "category",
      categoryId,
      label: categoryName,
    });
  }

  function requestDeleteProduct(categoryId: string, productId: string, productName: string): void {
    setPendingDelete({
      kind: "product",
      categoryId,
      productId,
      label: productName,
    });
  }

  function confirmDelete(): void {
    if (!pendingDelete) {
      return;
    }
    if (pendingDelete.kind === "category") {
      deleteCategory(pendingDelete.categoryId);
    } else {
      deleteProduct(pendingDelete.categoryId, pendingDelete.productId);
    }
    setPendingDelete(null);
  }

  return (
    <>
      <div className="category-list user-categories-list price-manager-list">
        {categories.map((category) => {
          const isOpen = openManagedCategoryId === category.id;
          return (
            <article key={category.id} className="category-card manage-category">
              <div className="manage-category-head">
                <button
                  className="ui-btn ui-btn--ghost category-btn manage-category-btn"
                  onClick={() => toggleManagedCategory(category.id)}
                  aria-expanded={isOpen}
                >
                  <span>
                    {category.name} ({category.items.length})
                  </span>
                </button>
                <button
                  type="button"
                  className="ui-icon-btn icon-action-btn danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    requestDeleteCategory(category.id, category.name);
                  }}
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

              <div className={`products manage-products ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
                {category.items.map((item) => (
                  <div key={item.id} className="product-row manage-product-row">
                    <div className="product-info">
                      <strong>{item.name}</strong>
                      {item.priceMode === "custom" && <span>Свободная цена</span>}
                    </div>
                    <div className="manage-actions">
                      {item.priceMode !== "custom" && (
                        <div className="manage-price-wrap">
                          <input
                            className="ui-input manage-inline-price-input"
                            inputMode="numeric"
                            value={getDraftPrice(category.id, item.id, item.price)}
                            onChange={(event) =>
                              updateDraftPrice(category.id, item.id, event.target.value)
                            }
                            onBlur={() => handlePriceBlur(category.id, item.id, item.price)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                (event.currentTarget as HTMLInputElement).blur();
                              }
                            }}
                            aria-label={`Цена товара ${item.name}`}
                          />
                          <span className="manage-inline-currency">{currencyAbbr}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="ui-icon-btn icon-action-btn danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          requestDeleteProduct(category.id, item.id, item.name);
                        }}
                        aria-label={`Удалить товар ${item.name}`}
                        title="Удалить товар"
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
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {pendingDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>{pendingDelete.kind === "category" ? "Удалить категорию?" : "Удалить товар?"}</h3>
            <p>
              {pendingDelete.kind === "category"
                ? `Категория «${pendingDelete.label}» и её товары будут удалены из прайса.`
                : `Товар «${pendingDelete.label}» будет удален из прайса.`}
            </p>
            <div className="modal-actions">
              <button className="ui-btn ui-btn--ghost" onClick={() => setPendingDelete(null)}>
                Отмена
              </button>
              <button className="ui-btn ui-btn--primary" onClick={confirmDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
