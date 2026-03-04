export type PriceMode = "fixed" | "custom";

export type Product = {
  id: string;
  name: string;
  price: number;
  priceMode?: PriceMode;
};

export type Category = {
  id: string;
  name: string;
  items: Product[];
};

export type PriceData = {
  categories: Category[];
};

export type CalculationLine = {
  categoryName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SavedCalculation = {
  id: string;
  createdAt: string;
  lines: CalculationLine[];
  total: number;
};

export type Screen = "home" | "calc" | "archive" | "add";

export type DraftProduct = {
  id: string;
  name: string;
  price: string;
  priceMode: PriceMode;
};
