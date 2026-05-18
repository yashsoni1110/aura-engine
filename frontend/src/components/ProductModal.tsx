'use client';

import { useState } from 'react';
import { Product, CATEGORIES } from '@/lib/types';
import { API_BASE } from '@/lib/types';

interface ProductModalProps {
  product?: Product | null;   // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  productName: '',
  sku: '',
  category: 'Electronics' as string,
  price: '',
  cost: '',
  stockQuantity: '',
  reorderLevel: '10',
};

export default function ProductModal({ product, onClose, onSaved }: ProductModalProps) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    productName: product?.productName ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? 'Electronics',
    price: product ? String(product.price) : '',
    cost: product ? String(product.cost) : '',
    stockQuantity: product ? String(product.stockQuantity) : '',
    reorderLevel: product ? String(product.reorderLevel) : '10',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      productName: form.productName.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stockQuantity: parseInt(form.stockQuantity, 10),
      reorderLevel: parseInt(form.reorderLevel, 10),
    };

    if (!payload.productName || !payload.sku) { setError('Product name and SKU are required.'); return; }
    if (isNaN(payload.price) || isNaN(payload.cost)) { setError('Price and cost must be valid numbers.'); return; }
    if (payload.price < payload.cost) { setError('Price cannot be lower than cost.'); return; }
    if (payload.stockQuantity < 0) { setError('Stock quantity cannot be negative.'); return; }

    setLoading(true);
    try {
      const url = isEdit ? `${API_BASE}/inventory/${product!._id}` : `${API_BASE}/inventory`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.errors?.[0]?.message || 'Request failed');
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{ opacity:0 } to{ opacity:1 } }
        .modal {
          background: var(--bg-card);
          border: 1px solid var(--border-hover);
          border-radius: 16px;
          padding: 32px;
          width: 520px; max-width: 95vw;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: slideUp 0.25s ease;
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes slideUp { from{ transform:translateY(16px); opacity:0 } to{ transform:translateY(0); opacity:1 } }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .modal-title { font-size: 18px; font-weight: 800; color: var(--text-primary); }
        .modal-close { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 20px; padding: 4px; border-radius: 6px; line-height: 1; transition: color 0.2s; }
        .modal-close:hover { color: var(--text-primary); }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .modal-grid .span-2 { grid-column: span 2; }
        .modal-error { background: var(--red-glow); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--red); margin-bottom: 16px; }
        .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
        .margin-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
      `}</style>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <div>
              <div className="modal-title">{isEdit ? '✏ Edit Product' : '＋ Add New Product'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {isEdit ? `SKU: ${product!.sku}` : 'All fields required unless noted'}
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {error && <div className="modal-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="modal-grid">
              <div className="span-2 input-group">
                <label className="input-label">Product Name</label>
                <input
                  type="text" className="input"
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  value={form.productName}
                  onChange={e => handleChange('productName', e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="input-group">
                <label className="input-label">SKU</label>
                <input
                  type="text" className="input"
                  placeholder="e.g. ELE-001234-ABCD"
                  value={form.sku}
                  onChange={e => handleChange('sku', e.target.value.toUpperCase())}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="select" value={form.category} onChange={e => handleChange('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Selling Price ($)</label>
                <input
                  type="number" className="input" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Cost Price ($)</label>
                <input
                  type="number" className="input" min="0" step="0.01"
                  placeholder="0.00"
                  value={form.cost}
                  onChange={e => handleChange('cost', e.target.value)}
                />
                {form.price && form.cost && !isNaN(parseFloat(form.price)) && !isNaN(parseFloat(form.cost)) && (
                  <div className="margin-hint">
                    Margin: {(((parseFloat(form.price) - parseFloat(form.cost)) / parseFloat(form.price)) * 100).toFixed(1)}%
                    {' '}({parseFloat(form.price) < parseFloat(form.cost) && <span style={{ color: 'var(--red)' }}>⚠ Price below cost</span>})
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Stock Quantity</label>
                <input
                  type="number" className="input" min="0" step="1"
                  placeholder="0"
                  value={form.stockQuantity}
                  onChange={e => handleChange('stockQuantity', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Reorder Level</label>
                <input
                  type="number" className="input" min="0" step="1"
                  placeholder="10"
                  value={form.reorderLevel}
                  onChange={e => handleChange('reorderLevel', e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '⟳ Saving…' : isEdit ? '✓ Save Changes' : '＋ Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
