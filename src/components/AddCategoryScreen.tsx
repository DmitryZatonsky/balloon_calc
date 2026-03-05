import type { Dispatch, SetStateAction } from "react";
import type { Category, DraftProduct } from "../types";
import { keepDigits } from "../utils";

type Props = {
  categories: Category[];
  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  targetCategoryId: string;
  setTargetCategoryId: Dispatch<SetStateAction<string>>;
  draftProducts: DraftProduct[];
  setDraftProducts: Dispatch<SetStateAction<DraftProduct[]>>;
  saveCategory: () => void;
  formMessage: string;
  renderHeader: (title: string) => React.ReactNode;
};

export function AddCategoryScreen({
  categories,
  newCategoryName,
  setNewCategoryName,
  targetCategoryId,
  setTargetCategoryId,
  draftProducts,
  setDraftProducts,
  saveCategory,
  formMessage,
  renderHeader,
}: Props) {
  return (
    <section className="screen add">
      {renderHeader("Добавить категорию")}

      <label className="field">
        <span>Куда добавить</span>
        <select
          className="ui-input"
          value={targetCategoryId}
          onChange={(event) => setTargetCategoryId(event.target.value)}
        >
          <option value="">Новая категория</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {!targetCategoryId && (
        <label className="field">
          <span>Название категории</span>
          <input
            className="ui-input"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="Например: Фольга"
          />
        </label>
      )}

      <div className="draft-products">
        {draftProducts.map((item, index) => (
          <div key={item.id} className="draft-row">
            <input
              className="ui-input draft-name"
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
              className="ui-input draft-price"
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
              <button className="ui-btn ui-btn--primary main-btn" onClick={saveCategory}>
                {targetCategoryId ? "Добавить товар" : "Сохранить категорию"}
              </button>
            )}
          </div>
        ))}
      </div>

      {formMessage && <p className="status">{formMessage}</p>}
    </section>
  );
}
