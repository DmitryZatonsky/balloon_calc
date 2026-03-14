import { useState } from "react";
import type {
  Category,
  CalculationLine,
  CustomFigureRow,
  Product,
  SavedCalculation,
} from "../types";
import { buildItemKey, getProducts } from "../utils";

type ProductIndex = Map<string, { categoryId: string; product: Product }>;

export function useCalcEngine() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    {},
  );
  const [lines, setLines] = useState<CalculationLine[]>([]);
  const [total, setTotal] = useState<number>(0);

  function setQuantity(
    categoryId: string,
    productId: string,
    nextValue: number,
  ): void {
    const key = buildItemKey(categoryId, productId);
    const normalized = Number.isFinite(nextValue)
      ? Math.max(0, Math.floor(nextValue))
      : 0;

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

  function buildCalculation(
    categories: Category[],
    customRows: CustomFigureRow[] = [],
  ): { lines: CalculationLine[]; total: number } {
    const nextLines: CalculationLine[] = [];
    let nextTotal = 0;

function processCategory(category: Category) {

  if (Array.isArray(category.items)) {
    for (const product of getProducts(category)) {

      const key = buildItemKey(category.id, product.id)
      const qty = quantities[key] ?? 0

      if (qty <= 0) continue

      const isCustom = product.priceMode === "custom"
      const customPrice = Number(customAmounts[key] ?? 0)
      const normalizedQty = isCustom ? 1 : qty
      const unitPrice = isCustom ? customPrice : product.price

      if (!unitPrice || unitPrice <= 0) continue

      const lineTotal = normalizedQty * unitPrice

      nextTotal += lineTotal

      nextLines.push({
        categoryName: category.name,
        productName: product.name,
        quantity: normalizedQty,
        unitPrice,
        lineTotal,
      })
    }
  }

  if (Array.isArray(category.items)) {
    for (const sub of category.items) {
      processCategory(sub)
    }
  }
}

    for (const category of categories) {
      processCategory(category);
    }

    const figuresCategory = categories.find(
      (category) => category.id === "figures",
    );

    const figuresLabel = figuresCategory ? figuresCategory.name : "Фигуры";

    for (const row of customRows) {
      const name = row.name.trim();
      const price = Number(row.price);
      if (!name || !Number.isFinite(price) || price <= 0) continue;

      const lineTotal = price;
      nextTotal += lineTotal;
      nextLines.push({
        categoryName: figuresLabel,
        productName: name,
        quantity: 1,
        unitPrice: price,
        lineTotal,
      });
    }

    return { lines: nextLines, total: nextTotal };
  }

  function handleCalculate(
    categories: Category[],
    customRows: CustomFigureRow[] = [],
  ): { lines: CalculationLine[]; total: number } {
    const result = buildCalculation(categories, customRows);
    setLines(result.lines);
    setTotal(result.total);
    return result;
  }

  function resetCalc(): void {
    setQuantities({});
    setCustomAmounts({});
    setLines([]);
    setTotal(0);
  }

  function applyArchivedRecord(
    record: SavedCalculation,
    indexByName: ProductIndex,
  ): number {
    const nextQuantities: Record<string, number> = {};
    const nextCustomAmounts: Record<string, string> = {};
    let matched = 0;

    for (const line of record.lines) {
      const found = indexByName.get(line.productName);
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
    return matched;
  }

  function dropCategorySelections(categoryId: string): void {
    setQuantities((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(
          ([key]) => !key.startsWith(`${categoryId}::`),
        ),
      ),
    );
    setCustomAmounts((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(
          ([key]) => !key.startsWith(`${categoryId}::`),
        ),
      ),
    );
  }

  function dropProductSelection(categoryId: string, productId: string): void {
    const key = buildItemKey(categoryId, productId);
    setQuantities((prev) => {
      if (!(key in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCustomAmounts((prev) => {
      if (!(key in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  return {
    quantities,
    customAmounts,
    setCustomAmounts,
    lines,
    total,
    setQuantity,
    activateItem,
    handleCalculate,
    resetCalc,
    applyArchivedRecord,
    dropCategorySelections,
    dropProductSelection,
  };
}
