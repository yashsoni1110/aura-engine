'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { Category } from '@/lib/types';

const CATEGORY_BADGE_MAP: Record<string, string> = {
  'Electronics': 'badge-electronics',
  'Apparel': 'badge-apparel',
  'Home & Garden': 'badge-home',
  'Sports & Outdoors': 'badge-sports',
  'Food & Beverage': 'badge-food',
  'Health & Beauty': 'badge-health',
  'Automotive': 'badge-auto',
  'Toys & Games': 'badge-toys',
  'Books & Media': 'badge-books',
  'Office Supplies': 'badge-office',
};

export function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_BADGE_MAP[category] || 'badge-office';
  return <span className={`badge ${cls}`}>{category}</span>;
}

export function StockCell({ qty, reorder }: { qty: number; reorder: number }) {
  if (qty === 0) return <span className="stock-zero">OUT OF STOCK</span>;
  if (qty <= reorder * 0.5) return <span className="stock-critical">{qty.toLocaleString()}</span>;
  if (qty <= reorder) return <span className="stock-low">{qty.toLocaleString()}</span>;
  return <span className="stock-ok">{qty.toLocaleString()}</span>;
}

export function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span className="sort-icon" style={{ fontSize: 10 }}>⇅</span>;
  return <span className="sort-icon" style={{ fontSize: 10 }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color: string;
}
export function KPICard({ label, value, sub, icon: Icon, color }: KPICardProps) {
  return (
    <div className="kpi-card" style={{ '--accent-color': color } as React.CSSProperties}>
      <div className="kpi-card__icon" style={{ background: `${color}18` }}>
        <Icon size={20} color={color} />
      </div>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__value">{value}</div>
      {sub && <div className="kpi-card__sub">{sub}</div>}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {/* 8 columns: #, SKU, Name, Category, Price, Stock, Last Updated, Actions */}
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i}><div className="skeleton" style={{ height: 16, width: i === 0 ? 24 : i === 2 ? 180 : 80 }} /></td>
      ))}
    </tr>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  onPage: (p: number) => void;
}
export function Pagination({ currentPage, totalPages, totalRecords, limit, onPage }: PaginationProps) {
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalRecords);

  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('…');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="pagination">
      <span className="pagination__info">
        Showing <strong>{start.toLocaleString()}–{end.toLocaleString()}</strong> of <strong>{totalRecords.toLocaleString()}</strong> products
      </span>
      <div className="pagination__controls">
        <button className="page-btn" disabled={currentPage === 1} onClick={() => onPage(currentPage - 1)}>‹</button>
        {pages.map((p, i) =>
          typeof p === 'string'
            ? <span key={`ellipsis-${i}`} className="page-btn" style={{ border: 'none', background: 'none' }}>…</span>
            : <button key={p} className={`page-btn ${p === currentPage ? 'active' : ''}`} onClick={() => onPage(p as number)}>{p}</button>
        )}
        <button className="page-btn" disabled={currentPage === totalPages} onClick={() => onPage(currentPage + 1)}>›</button>
      </div>
    </div>
  );
}
