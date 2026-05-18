'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuthGuard, clearSession } from '@/hooks/useAuthGuard';
import { useCompactMode } from '@/hooks/useCompactMode';
import {
  User, Mail, Shield, Clock, Activity, Settings, Key, Bell,
  LogOut, ChevronRight, BarChart3, Package, Database, Globe,
  CheckCircle, AlertTriangle, Lock, Eye, EyeOff, Zap, TrendingUp,
} from 'lucide-react';

/* ─── static demo data ─────────────────────────────────────────────────── */
const RECENT_ACTIVITY = [
  { icon: Package,    color: '#6366f1', label: 'Exported inventory CSV',        time: '2 min ago' },
  { icon: BarChart3,  color: '#10b981', label: 'Viewed analytics dashboard',    time: '18 min ago' },
  { icon: Package,    color: '#f59e0b', label: 'Updated product SKU-021456',    time: '1 hr ago' },
  { icon: Shield,     color: '#06b6d4', label: 'Logged in from 192.168.1.4',    time: '1 hr ago' },
  { icon: Package,    color: '#ef4444', label: 'Deleted obsolete SKU-004321',   time: '3 hrs ago' },
  { icon: BarChart3,  color: '#a855f7', label: 'Generated restock priority report', time: 'Yesterday' },
];

const PERMISSIONS = [
  { label: 'Inventory Management',   granted: true  },
  { label: 'Analytics Dashboard',    granted: true  },
  { label: 'Product Create / Edit',  granted: true  },
  { label: 'Product Delete',         granted: true  },
  { label: 'CSV Export',             granted: true  },
  { label: 'User Administration',    granted: false },
  { label: 'System Configuration',   granted: false },
];

const SESSION_STATS = [
  { label: 'Total Sessions', value: '142' },
  { label: 'Avg Session',    value: '38 min' },
  { label: 'Data Exported',  value: '4.2 GB' },
  { label: 'SKUs Touched',   value: '3,841' },
];

/* ─── helper ────────────────────────────────────────────────────────────── */
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

/* ─── tab id type ───────────────────────────────────────────────────────── */
type Tab = 'overview' | 'activity' | 'permissions' | 'preferences' | 'security';

/* ═══════════════════════════════════════════════════════════════════════════
   Profile Page
══════════════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const router = useRouter();
  const ready  = useAuthGuard();

  const adminName  = process.env.NEXT_PUBLIC_ADMIN_NAME  || 'Admin';
  const adminRole  = process.env.NEXT_PUBLIC_ADMIN_ROLE  || 'System Administrator';
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
  const initials   = getInitials(adminName);

  const handleSignOut = () => { clearSession(); router.replace('/login'); };

  const [activeTab,    setActiveTab]    = useState<Tab>('overview');
  const [notifyEmail,  setNotifyEmail]  = useState(true);
  const [notifyStock,  setNotifyStock]  = useState(true);
  const [notifyExport, setNotifyExport] = useState(false);
  const [compactMode,  setCompactMode]  = useCompactMode();   // ← persisted
  const [showPassword, setShowPassword] = useState(false);

  const memberSince = new Date('2025-01-15').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const lastLogin   = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',     label: 'Overview',      icon: User      },
    { id: 'activity',     label: 'Activity',       icon: Activity  },
    { id: 'permissions',  label: 'Permissions',    icon: Shield    },
    { id: 'preferences',  label: 'Preferences',    icon: Settings  },
    { id: 'security',     label: 'Security',       icon: Key       },
  ];

  if (!ready) return null;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {/* ── Topbar ── */}
        <header className="topbar">
          <div>
            <div className="topbar__title">My Profile</div>
            <div className="topbar__subtitle">Account settings & activity for {adminName}</div>
          </div>
          <div className="topbar__actions">
            <button className="btn btn-danger btn-sm" onClick={handleSignOut}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </header>

        <div className="page" style={{ maxWidth: 1100 }}>

          {/* ── Hero card ── */}
          <div className="card" style={{
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24,
            background: 'linear-gradient(135deg, #131929 0%, #1a2035 100%)',
            borderColor: 'rgba(99,102,241,0.2)', overflow: 'hidden', position: 'relative',
          }}>
            {/* glow blob */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#fff',
              boxShadow: '0 0 30px rgba(99,102,241,0.4)',
            }}>
              {initials}
            </div>

            {/* name / meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{adminName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: 'var(--accent-light)',
                }}>{adminRole}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={11} /> {adminEmail || '—'}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={11} /> Member since {memberSince}
                </span>
              </div>
            </div>

            {/* quick stats */}
            <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
              {[
                { label: 'Sessions',  value: '142',    color: 'var(--accent)' },
                { label: 'Modules',   value: '5',      color: 'var(--green)'  },
                { label: 'Exports',   value: '38',     color: 'var(--cyan)'   },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tab strip ── */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ═══════════ OVERVIEW ═══════════ */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Account info */}
              <div className="card">
                <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                  <User size={13} /> Account Information
                </div>
                {[
                  { label: 'Display Name', value: adminName },
                  { label: 'Email',        value: adminEmail || '—' },
                  { label: 'Role',         value: adminRole },
                  { label: 'Department',   value: 'Operations & Logistics' },
                  { label: 'Location',     value: 'Midwest USA' },
                  { label: 'Member Since', value: memberSince },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 0', borderBottom: '1px solid rgba(99,130,255,0.07)',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Session stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
                    <TrendingUp size={13} /> Usage Statistics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {SESSION_STATS.map(s => (
                      <div key={s.label} style={{
                        background: 'var(--bg-primary)', borderRadius: 8,
                        padding: '14px 16px', border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                    <Globe size={13} /> Current Session
                  </div>
                  {[
                    { label: 'Last login',  value: lastLogin,        icon: Clock    },
                    { label: 'IP Address',  value: '192.168.1.4',    icon: Globe    },
                    { label: 'Platform',    value: 'Chrome / Windows', icon: Zap    },
                    { label: 'Status',      value: 'Active',         icon: CheckCircle },
                  ].map(r => {
                    const Icon = r.icon;
                    return (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(99,130,255,0.07)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon size={11} /> {r.label}
                        </span>
                        <span style={{ fontSize: 12, color: r.label === 'Status' ? 'var(--green)' : 'var(--text-primary)', fontWeight: 500 }}>{r.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ ACTIVITY ═══════════ */}
          {activeTab === 'activity' && (
            <div className="card">
              <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                <Activity size={13} /> Recent Activity Log
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {RECENT_ACTIVITY.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 8,
                      background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      transition: 'border-color 0.2s',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `${a.color}18`, border: `1px solid ${a.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={15} color={a.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{a.label}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{a.time}</div>
                      <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ PERMISSIONS ═══════════ */}
          {activeTab === 'permissions' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card">
                <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                  <Shield size={13} /> Module Access
                </div>
                {PERMISSIONS.map(p => (
                  <div key={p.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0', borderBottom: '1px solid rgba(99,130,255,0.07)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.label}</span>
                    {p.granted ? (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: 'var(--green)',
                      }}>
                        <CheckCircle size={10} /> Granted
                      </span>
                    ) : (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.2)',
                        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                      }}>
                        <Lock size={10} /> Restricted
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                  <Database size={13} /> Data Access Scope
                </div>
                {[
                  { label: 'SKU Records',    value: 'All 50,000+',  color: 'var(--accent-light)' },
                  { label: 'Categories',     value: 'All 10',       color: 'var(--cyan)' },
                  { label: 'Retail Chains',  value: '40 Locations', color: 'var(--green)' },
                  { label: 'Price Data',     value: 'Read + Write', color: 'var(--amber)' },
                  { label: 'Analytics',      value: 'Full Access',  color: 'var(--purple)' },
                ].map(r => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid rgba(99,130,255,0.07)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div style={{
                  marginTop: 16, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <AlertTriangle size={14} color="var(--amber)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Role-based access managed by your system administrator.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ PREFERENCES ═══════════ */}
          {activeTab === 'preferences' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Notifications */}
              <div className="card">
                <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                  <Bell size={13} /> Notification Preferences
                </div>
                {[
                  { label: 'Email Alerts',          sub: 'Receive critical system emails',    state: notifyEmail,  set: setNotifyEmail  },
                  { label: 'Low Stock Warnings',    sub: 'Alert when SKUs hit reorder level', state: notifyStock,  set: setNotifyStock  },
                  { label: 'Export Confirmations',  sub: 'Notify on CSV download complete',   state: notifyExport, set: setNotifyExport },
                ].map(pref => (
                  <div key={pref.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 0', borderBottom: '1px solid rgba(99,130,255,0.07)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{pref.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{pref.sub}</div>
                    </div>
                    <button
                      onClick={() => pref.set(!pref.state)}
                      style={{
                        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                        background: pref.state ? 'var(--accent)' : 'var(--bg-primary)',
                        boxShadow: pref.state ? '0 0 10px var(--accent-glow)' : 'none',
                        transition: 'background 0.25s, box-shadow 0.25s', position: 'relative', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3,
                        left: pref.state ? 21 : 3,
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.25s',
                      }} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Display */}
              <div className="card">
                <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                  <Settings size={13} /> Display Preferences
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(99,130,255,0.07)' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Compact Table Mode</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Reduce row padding in inventory grid</div>
                  </div>
                  <button
                    onClick={() => setCompactMode(!compactMode)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: compactMode ? 'var(--accent)' : 'var(--bg-primary)',
                      boxShadow: compactMode ? '0 0 10px var(--accent-glow)' : 'none',
                      transition: 'background 0.25s', position: 'relative', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3,
                      left: compactMode ? 21 : 3,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.25s',
                    }} />
                  </button>
                </div>

                <div style={{
                  marginTop: 20, background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={13} /> Preferences Auto-Saved
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Your display settings are saved automatically and persist across sessions.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ SECURITY ═══════════ */}
          {activeTab === 'security' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Password */}
              <div className="card">
                <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                  <Key size={13} /> Password & Authentication
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      defaultValue="••••••••••"
                      readOnly
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                  Change Password
                </button>

                <div style={{
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 8, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} /> Security Notice
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Credentials are managed via environment configuration. Contact your infrastructure team to rotate secrets.
                  </div>
                </div>
              </div>

              {/* Security status */}
              <div className="card">
                <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 20 }}>
                  <Shield size={13} /> Security Status
                </div>
                {[
                  { label: 'TLS 1.3 Encryption',   status: 'Active',    ok: true  },
                  { label: 'CORS Policy',            status: 'Enforced',  ok: true  },
                  { label: 'Rate Limiting',          status: '200 req/min', ok: true },
                  { label: 'Helmet Headers',         status: 'Enabled',   ok: true  },
                  { label: 'Multi-Factor Auth',      status: 'Not set',   ok: false },
                  { label: 'Session Timeout',        status: 'Inactive',  ok: false },
                ].map(s => (
                  <div key={s.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 0', borderBottom: '1px solid rgba(99,130,255,0.07)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{s.label}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: s.ok ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${s.ok ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.2)'}`,
                      color: s.ok ? 'var(--green)' : 'var(--amber)',
                    }}>
                      {s.status}
                    </span>
                  </div>
                ))}

                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleSignOut}
                  style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
                >
                  <LogOut size={13} /> Sign Out of All Sessions
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
