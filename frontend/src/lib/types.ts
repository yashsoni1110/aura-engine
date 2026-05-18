const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API_BASE = `${NEXT_PUBLIC_API_URL}/api`;

export const CATEGORIES = [
  'Electronics',
  'Apparel',
  'Home & Garden',
  'Sports & Outdoors',
  'Food & Beverage',
  'Health & Beauty',
  'Automotive',
  'Toys & Games',
  'Books & Media',
  'Office Supplies',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Product {
  _id: string;
  productName: string;
  sku: string;
  category: Category;
  price: number;
  cost: number;
  stockQuantity: number;
  reorderLevel: number;
  lastUpdated: string;
}

export interface PaginationMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface InventoryResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationMeta;
}

export interface KPISummary {
  totalSKUs: number;
  totalInventoryValue: number;
  outOfStockCount: number;
  avgPrice: number;
}

export interface CategoryValuation {
  category: string;
  totalValue: number;
  skuCount: number;
}

export interface RestockItem {
  _id: string;
  productName: string;
  sku: string;
  stockQuantity: number;
  reorderLevel: number;
  category: string;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    summary: KPISummary;
    categoryValuation: CategoryValuation[];
    restockPriority: RestockItem[];
    outOfStock: Product[];
  };
}

export type SortField = 'productName' | 'sku' | 'category' | 'price' | 'stockQuantity' | 'lastUpdated';
export type SortDirection = 'asc' | 'desc';
