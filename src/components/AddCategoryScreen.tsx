import type { Dispatch, SetStateAction } from "react";
import type { Category, DraftProduct } from "../types";
import { keepDigits } from "../utils";

type Props = {
  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  draftProducts: DraftProduct[];
  setDraftProducts: Dispatch<SetStateAction<DraftProduct[]>>;
  saveCategory: () => void;
  formMessage: string;
  extraCategories: Category[];
  deleteExtraCategory: (categoryId: string) => void;
  renderHeader: (title: string) => React.ReactNode;
};

export function AddCategoryScreen({
  newCategoryName,
  setNewCategoryName,
  draftProducts,
  setDraftProducts,
  saveCategory,
  formMessage,
  extraCategories,
  deleteExtraCategory,
  renderHeader,
}: Props) {
  return (
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
                          price: keepDigits(event.target.value),
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
              <button className="ghost-btn" onClick={saveCategory}>
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
  );
}
