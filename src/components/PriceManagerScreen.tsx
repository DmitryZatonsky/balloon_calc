import { useEffect, useState } from "react";
import type { Category } from "../types";
import { PriceManagerPanel } from "./PriceManagerPanel";

type Props = {
  categories: Category[];
  formMessage: string;
  currencyAbbr: string;
  updateCurrencyAbbr: (nextValue: string) => void;
  deleteCategory: (categoryId: string) => void;
  deleteProduct: (categoryId: string, productId: string) => void;
  updateProductPrice: (categoryId: string, productId: string, nextPrice: number) => void;
  renderHeader: (title: string) => React.ReactNode;
};

export function PriceManagerScreen({
  categories,
  formMessage,
  currencyAbbr,
  updateCurrencyAbbr,
  deleteCategory,
  deleteProduct,
  updateProductPrice,
  renderHeader,
}: Props) {
  const [currencyDraft, setCurrencyDraft] = useState<string>(currencyAbbr);

  useEffect(() => {
    setCurrencyDraft(currencyAbbr);
  }, [currencyAbbr]);

  function handleCurrencyBlur(): void {
    updateCurrencyAbbr(currencyDraft);
  }

  return (
    <section className="screen price-manager-screen">
      {renderHeader("Управление прайсом")}

      <div className="currency-setting-row">
        <span className="currency-setting-label">Валюта</span>
        <input
          className="ui-input manage-inline-price-input currency-abbr-input"
          value={currencyDraft}
          onChange={(event) => setCurrencyDraft(event.target.value)}
          onBlur={handleCurrencyBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              (event.currentTarget as HTMLInputElement).blur();
            }
          }}
          placeholder="грн"
        />
      </div>

      <PriceManagerPanel
        categories={categories}
        currencyAbbr={currencyAbbr}
        deleteCategory={deleteCategory}
        deleteProduct={deleteProduct}
        updateProductPrice={updateProductPrice}
      />
      {formMessage && <p className="status">{formMessage}</p>}
    </section>
  );
}
