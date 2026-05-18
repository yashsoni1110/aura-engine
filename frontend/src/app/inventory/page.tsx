'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { CategoryBadge, StockCell, SortIcon, SkeletonRow, Pagination } from '@/components/ui';
import { ToastContainer, ToastData } from '@/components/Toast';
import ProductModal from '@/components/ProductModal';
import { fetchInventory, exportToCSV, formatCurrency } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Product, SortField, SortDirection, PaginationMeta, CATEGORIES, API_BASE } from '@/lib/types';
import { Plus, Download, RefreshCw, Search, SlidersHorizontal, X, PackageOpen, Edit3, Trash2 } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useCompactMode } from '@/hooks/useCompactMode';

export default function InventoryPage() {
  const ready        = useAuthGuard();
  const [compactMode] = useCompactMode();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [maxStockInput, setMaxStockInput] = useState(5000);
  const [maxStock, setMaxStock] = useState<number | undefined>();
  const [showStockFilter, setShowStockFilter] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('lastUpdated');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const addToast = useCallback((type: ToastData['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(t => [...t, { id, type, message }]);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), []);

  // 500ms debounced search
  const debouncedSetSearch = useDebounce((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, 500);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // 400ms debounce for slider/price inputs — sliders fire 60+ events/sec
  const debouncedSetMaxStock = useDebounce((v: number) => {
    setMaxStock(v < 5000 ? v : undefined);
    setCurrentPage(1);
  }, 400);
  const debouncedSetMinPrice = useDebounce((v: number) => {
    setMinPrice(v);
    setCurrentPage(1);
  }, 400);
  const debouncedSetMaxPrice = useDebounce((v: number) => {
    setMaxPrice(v);
    setCurrentPage(1);
  }, 400);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sortParam = sortDir === 'desc' ? `-${sortField}` : sortField;
      const res = await fetchInventory({
        page: currentPage, limit: pageSize,
        search: searchQuery, category,
        sort: sortParam, minPrice, maxPrice,
        maxStock: showStockFilter ? maxStock : undefined,
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, category, sortField, sortDir, minPrice, maxPrice, maxStock, showStockFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput(''); setSearchQuery(''); setCategory('');
    setMaxStock(undefined); setMaxStockInput(5000); setShowStockFilter(false);
    setMinPrice(0); setMaxPrice(10000);
    setSortField('lastUpdated'); setSortDir('desc'); setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const rows = products.map(p => ({
      SKU: p.sku, 'Product Name': p.productName, Category: p.category,
      'Price ($)': p.price, 'Cost ($)': p.cost,
      'Stock Qty': p.stockQuantity, 'Reorder Level': p.reorderLevel,
      'Last Updated': new Date(p.lastUpdated).toLocaleDateString(),
    }));
    exportToCSV(rows as unknown as Record<string, unknown>[], 'aura-inventory-export');
    addToast('success', `Exported ${rows.length} products to CSV`);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.productName}" (${product.sku})? This cannot be undone.`)) return;
    setDeletingId(product._id);
    try {
      const res = await fetch(`${API_BASE}/inventory/${product._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      addToast('success', `${product.sku} deleted successfully`);
      fetchData();
    } catch {
      addToast('error', 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditingProduct(p); setModalOpen(true); };
  const handleSaved = () => {
    setModalOpen(false);
    addToast('success', editingProduct ? 'Product updated successfully' : 'Product created successfully');
    fetchData();
  };

  const columns: { key: SortField; label: string }[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'productName', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'stockQuantity', label: 'Stock' },
    { key: 'lastUpdated', label: 'Last Updated' },
  ];

  if (!ready) return null;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar__title">Inventory Grid</div>
            <div className="topbar__subtitle">
              {pagination ? `${pagination.totalRecords.toLocaleString()} total SKUs · Page ${pagination.currentPage} of ${pagination.totalPages.toLocaleString()}` : 'Loading…'}
            </div>
          </div>
          <div className="topbar__actions">
            <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={14} /> Add Product
            </button>
            <button className="btn btn-success btn-sm" onClick={handleExportCSV} disabled={loading || products.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Download size={13} /> Export Page CSV
            </button>
            <button className="btn btn-ghost btn-sm" onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={13} className={loading ? 'spin-icon' : ''} /> {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className="page">
          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-bar__top">
              <div className="filter-search input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Search size={11} /> Omnisearch <span style={{ color: 'var(--accent-light)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(500ms debounce)</span>
                </label>
                <div className="search-wrap">
                  <Search size={14} className="search-icon" />
                  <input
                    id="search-input" type="text" className="input"
                    placeholder="Search by product name or SKU…"
                    value={searchInput}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>

              <div className="filter-field input-group">
                <label className="input-label">Category</label>
                <select id="category-filter" className="select" value={category}
                  onChange={e => { setCategory(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group" style={{ minWidth: 100 }}>
                <label className="input-label">Per Page</label>
                <select className="select" value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                  {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowStockFilter(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <SlidersHorizontal size={13} /> Filters
                </button>
                <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <X size={13} /> Clear
                </button>
              </div>
            </div>

            {showStockFilter && (
              <div className="filter-bar__advanced">
                <div className="filter-field input-group">
                  <label className="input-label">Max Stock ≤ {maxStockInput >= 5000 ? 'Any' : maxStockInput.toLocaleString()}</label>
                  <input id="stock-slider" type="range" className="range-slider"
                    min={0} max={5000} step={10} value={maxStockInput}
                    onChange={e => {
                      const v = parseInt(e.target.value);
                      setMaxStockInput(v);
                      debouncedSetMaxStock(v);
                    }}
                  />
                  <div className="range-label"><span>0</span><span>5,000+</span></div>
                </div>
                <div className="filter-field input-group">
                  <label className="input-label">Min Price ($)</label>
                  <input type="number" className="input" min={0} value={minPrice}
                    onChange={e => debouncedSetMinPrice(Number(e.target.value))} />
                </div>
                <div className="filter-field input-group">
                  <label className="input-label">Max Price ($)</label>
                  <input type="number" className="input" min={minPrice} value={maxPrice}
                    onChange={e => debouncedSetMaxPrice(Number(e.target.value))} />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'var(--red-glow)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 16, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 10 }}>
              ⚠ {error}
              <button className="btn btn-ghost btn-sm" onClick={fetchData} style={{ marginLeft: 'auto' }}>Retry</button>
            </div>
          )}

          {/* Table */}
          <div className="table-wrap">
            <div className="table-container">
              <table className={`table${compactMode ? ' compact' : ''}`}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    {columns.map(col => (
                      <th key={col.key} className={sortField === col.key ? 'sorted' : ''}
                        onClick={() => handleSort(col.key)}>
                        {col.label} <SortIcon active={sortField === col.key} dir={sortDir} />
                      </th>
                    ))}
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)
                    : products.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                          <div style={{ marginBottom: 12 }}><PackageOpen size={36} color="var(--text-muted)" /></div>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>No products found</div>
                          <div style={{ fontSize: 12 }}>Try adjusting your search or filters</div>
                        </td>
                      </tr>
                    )
                    : products.map((p, idx) => (
                      <tr key={p._id}>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                          {((currentPage - 1) * pageSize) + idx + 1}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent-light)', letterSpacing: '0.03em' }}>{p.sku}</td>
                        <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.productName}>
                          <span style={{ fontWeight: 500 }}>{p.productName}</span>
                        </td>
                        <td><CategoryBadge category={p.category} /></td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{formatCurrency(p.price)}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Cost: {formatCurrency(p.cost)}</div>
                        </td>
                        <td><StockCell qty={p.stockQuantity} reorder={p.reorderLevel} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {new Date(p.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} style={{ padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(p)}
                              disabled={deletingId === p._id}
                              style={{ padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Trash2 size={12} /> {deletingId === p._id ? '…' : 'Del'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {pagination && !loading && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalRecords={pagination.totalRecords}
                limit={pagination.limit}
                onPage={setCurrentPage}
              />
            )}
          </div>
        </div>
      </main>

      {/* Product Modal */}
      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
