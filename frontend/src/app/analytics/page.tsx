'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Sidebar from '@/components/Sidebar';
import { KPICard } from '@/components/ui';
import { fetchAnalytics, formatCurrency, formatCurrencyCompact, formatNumber } from '@/lib/api';
import { AnalyticsResponse } from '@/lib/types';
import { Package, DollarSign, TrendingUp, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const PIE_COLORS = [
  '#6366f1','#a855f7','#06b6d4','#10b981',
  '#f59e0b','#ef4444','#ec4899','#8b5cf6',
  '#14b8a6','#f97316',
];

interface TooltipEntry { color?: string; value?: number | string; name?: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }

const BarTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow)', minWidth: 160 }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 6, maxWidth: 200, whiteSpace: 'normal' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || '#6366f1', fontWeight: 700, fontSize: 15 }}>
          {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value} units
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow)' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>{entry.name}</p>
      <p style={{ color: entry.color || '#6366f1', fontWeight: 700, fontSize: 15 }}>
        {typeof entry.value === 'number' ? formatCurrency(entry.value) : '—'}
      </p>
    </div>
  );
};

export default function AnalyticsPage() {
  const ready = useAuthGuard();
  const [data, setData] = useState<AnalyticsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = () => {
    setLoading(true);
    setError('');
    fetchAnalytics()
      .then(res => { setData(res.data); setLastRefresh(new Date()); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const summary = data?.summary;
  const pieData = (data?.categoryValuation ?? []).map(c => ({
    name: c.category,
    value: parseFloat(c.totalValue.toFixed(2)),
    skuCount: c.skuCount,
  }));

  // Shorten product names for bar chart labels
  const restockChartData = (data?.restockPriority ?? []).map(p => ({
    ...p,
    shortName: p.productName.split(' ').slice(0, 3).join(' '),
  }));

  if (!ready) return null;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar__title">Command Center</div>
            <div className="topbar__subtitle">
              {lastRefresh
                ? `Last refreshed ${lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Real-time analytics · MongoDB aggregation pipelines'}
            </div>
          </div>
          <div className="topbar__actions">
            <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className="page">
          {error && (
            <div style={{ background: 'var(--red-glow)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', padding: '14px 20px', marginBottom: 24, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={16} />
              <span>{error} — Is the backend running on port 5000?</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={loadData}>Retry</button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="kpi-grid">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="kpi-card">
                  <div className="skeleton" style={{ height: 10, width: 80, marginBottom: 14 }} />
                  <div className="skeleton" style={{ height: 36, width: 120, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 10, width: 140 }} />
                </div>
              ))
            ) : (
              <>
                <KPICard
                  label="Total SKUs"
                  value={summary ? formatNumber(summary.totalSKUs) : '—'}
                  sub="Distinct products tracked"
                  icon={Package}
                  color="var(--accent)"
                />
                <KPICard
                  label="Inventory Value"
                  value={summary ? formatCurrencyCompact(summary.totalInventoryValue) : '—'}
                  sub={summary ? `Full: ${formatCurrency(summary.totalInventoryValue)}` : ''}
                  icon={DollarSign}
                  color="var(--green)"
                />
                <KPICard
                  label="Avg Unit Price"
                  value={summary ? formatCurrency(summary.avgPrice) : '—'}
                  sub="Across all categories"
                  icon={TrendingUp}
                  color="var(--cyan)"
                />
                <KPICard
                  label="Out of Stock"
                  value={summary ? formatNumber(summary.outOfStockCount) : '—'}
                  sub={summary ? `${((summary.outOfStockCount / summary.totalSKUs) * 100).toFixed(1)}% of total SKUs` : ''}
                  icon={AlertTriangle}
                  color="var(--red)"
                />
              </>
            )}
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Restock Priority Bar Chart — full width */}
            <div className="chart-card" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div className="chart-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={15} color="var(--amber)" /> Restock Priority Queue
                  </div>
                  <div className="chart-card__sub" style={{ marginBottom: 0 }}>Top 10 products with critically low stock — requires immediate attention</div>
                </div>
                <span style={{ background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                  URGENT
                </span>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 280 }} />
              ) : restockChartData.length === 0 ? (
                <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No critical stock items found
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={restockChartData} margin={{ top: 5, right: 20, bottom: 70, left: 10 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatNumber(v)}
                      allowDecimals={false}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                    <Bar dataKey="stockQuantity" name="Stock Qty" radius={[5, 5, 0, 0]}>
                      {restockChartData.map((entry, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={entry.stockQuantity <= 3 ? '#ef4444' : entry.stockQuantity <= 7 ? '#f59e0b' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {/* Color legend */}
              {!loading && (
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> ≤ 3 units (Critical)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> 4–7 units (Low)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} /> 8+ units (Warning)</span>
                </div>
              )}
            </div>

            {/* Portfolio Pie Chart */}
            <div className="chart-card">
              <div className="chart-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={15} color="var(--accent-light)" /> Portfolio Distribution
              </div>
              <div className="chart-card__sub">Total inventory valuation by category</div>
              {loading ? (
                <div className="skeleton" style={{ height: 300 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="45%"
                      outerRadius={100}
                      innerRadius={55}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{val}</span>}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category Breakdown Table */}
            <div className="chart-card">
              <div className="chart-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={15} color="var(--accent-light)" /> Category Breakdown
              </div>
              <div className="chart-card__sub">Valuation & SKU count per category</div>
              {loading ? (
                <div className="skeleton" style={{ height: 300 }} />
              ) : (
                <div style={{ overflowY: 'auto', maxHeight: 320 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>SKUs</th>
                        <th style={{ textAlign: 'right' }}>Value</th>
                        <th style={{ textAlign: 'right' }}>% Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const total = pieData.reduce((s, c) => s + c.value, 0);
                        return pieData.map((c, i) => (
                          <tr key={c.name}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block', flexShrink: 0 }} />
                              <span style={{ fontSize: 12 }}>{c.name}</span>
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 12 }}>{c.skuCount.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--green)', fontSize: 12 }}>{formatCurrencyCompact(c.value)}</td>
                            <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                              {total > 0 ? ((c.value / total) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Out of Stock Alert Panel */}
          {!loading && data?.outOfStock && data.outOfStock.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div className="card__title" style={{ color: 'var(--red)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={15} /> Out of Stock — Immediate Action Required ({data.outOfStock.length} items)
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {data.outOfStock.map(p => (
                  <div key={p._id} style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Package size={16} color="var(--red)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productName}</div>
                      <div style={{ color: 'var(--red)', fontFamily: 'monospace', fontSize: 11 }}>{p.sku}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
