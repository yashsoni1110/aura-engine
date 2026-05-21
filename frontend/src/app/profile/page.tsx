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

// Static demo data
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
  { label: 'Total Sessions', value: '12' },
  { label: 'Avg Session',    value: '14 min' },
  { label: 'Data Exported',  value: '24.5 MB' },
  { label: 'SKUs Touched',   value: '84' },
];

// Helper to get initials
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

type Tab = 'overview' | 'activity' | 'permissions' | 'preferences' | 'security';

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
  const [compactMode,  setCompactMode]  = useCompactMode();
  const [showPassword, setShowPassword] = useState(false);

  const memberSince = new Date('2025-01-15').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const lastLogin   = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',     label: 'Overview',      icon: User      },
    { id: 'activity',     label: 'Activity',      icon: Activity  },
    { id: 'permissions',  label: 'Permissions',    icon: Shield    },
    { id: 'preferences',  label: 'Preferences',    icon: Settings  },
    { id: 'security',     label: 'Security',       icon: Key       },
  ];

  if (!ready) return null;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar__title">My Profile</div>
            <div className="topbar__subtitle">Account settings & activity for {adminName}</div>
          </div>
          <div className="topbar__actions">
            <button className="btn btn-danger btn-sm" onClick={handleSignOut}>
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </header>

        <div className="page page-profile">
          {/* Hero Card */}
          <div className="card profile-hero">
            <div className="profile-hero__glow" />

            <div className="profile-hero__avatar">
              {initials}
            </div>

            <div className="profile-hero__info">
              <div className="profile-hero__name">{adminName}</div>
              <div className="profile-hero__meta">
                <span className="profile-hero__badge">{adminRole}</span>
                <span className="profile-hero__meta-item">
                  <Mail size={11} /> {adminEmail || '—'}
                </span>
                <span className="profile-hero__meta-item">
                  <Clock size={11} /> Member since {memberSince}
                </span>
              </div>
            </div>

            <div className="profile-hero__stats">
              {[
                { label: 'Sessions',  value: '12',    color: 'var(--accent)' },
                { label: 'Modules',   value: '3',      color: 'var(--green)'  },
                { label: 'Exports',   value: '4',     color: 'var(--cyan)'   },
              ].map(s => (
                <div key={s.label} className="profile-stat">
                  <div className="profile-stat__value" style={{ color: s.color }}>{s.value}</div>
                  <div className="profile-stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="profile-grid-2col">
              <div className="card">
                <div className="card__title card__title--profile">
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
                  <div key={row.label} className="profile-row">
                    <span className="profile-row__label">{row.label}</span>
                    <span className="profile-row__val">{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card__title card__title--profile">
                    <TrendingUp size={13} /> Usage Statistics
                  </div>
                  <div className="profile-stats-grid">
                    {SESSION_STATS.map(s => (
                      <div key={s.label} className="profile-stat-card">
                        <div className="profile-stat-card__value">{s.value}</div>
                        <div className="profile-stat-card__label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card__title card__title--profile">
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
                      <div key={r.label} className="profile-row">
                        <span className="profile-row__label-flex">
                          <Icon size={11} /> {r.label}
                        </span>
                        <span className={`profile-row__val-sm ${r.label === 'Status' ? 'u-color-green' : ''}`}>
                          {r.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div className="card">
              <div className="card__title card__title--profile">
                <Activity size={13} /> Recent Activity Log
              </div>
              <div className="profile-list-vertical">
                {RECENT_ACTIVITY.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="profile-activity-row">
                      <div
                        className="profile-activity-icon-container"
                        style={{
                          backgroundColor: `${a.color}18`,
                          borderColor: `${a.color}30`,
                        }}
                      >
                        <Icon size={15} color={a.color} />
                      </div>
                      <div className="u-flex-1">
                        <div className="profile-row__val">{a.label}</div>
                      </div>
                      <div className="profile-activity-time">{a.time}</div>
                      <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="profile-grid-2col">
              <div className="card">
                <div className="card__title card__title--profile">
                  <Shield size={13} /> Module Access
                </div>
                {PERMISSIONS.map(p => (
                  <div key={p.label} className="profile-row">
                    <span className="profile-row__val">{p.label}</span>
                    {p.granted ? (
                      <span className="profile-badge profile-badge--granted">
                        <CheckCircle size={10} /> Granted
                      </span>
                    ) : (
                      <span className="profile-badge profile-badge--restricted">
                        <Lock size={10} /> Restricted
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card__title card__title--profile">
                  <Database size={13} /> Data Access Scope
                </div>
                {[
                  { label: 'SKU Records',    value: 'All 50,000+',  color: 'var(--accent-light)' },
                  { label: 'Categories',     value: 'All 10',       color: 'var(--cyan)' },
                  { label: 'Retail Chains',  value: '40 Locations', color: 'var(--green)' },
                  { label: 'Price Data',     value: 'Read + Write', color: 'var(--amber)' },
                  { label: 'Analytics',      value: 'Full Access',  color: 'var(--purple)' },
                ].map(r => (
                  <div key={r.label} className="profile-row">
                    <span className="profile-row__val" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span className="u-text-sm" style={{ fontWeight: 700, color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div className="profile-alert-box">
                  <AlertTriangle size={14} color="var(--amber)" />
                  <span className="profile-pref-sub">
                    Role-based access managed by your system administrator.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="profile-grid-2col">
              <div className="card">
                <div className="card__title card__title--profile">
                  <Bell size={13} /> Notification Preferences
                </div>
                {[
                  { label: 'Email Alerts',          sub: 'Receive critical system emails',    state: notifyEmail,  set: setNotifyEmail  },
                  { label: 'Low Stock Warnings',    sub: 'Alert when SKUs hit reorder level', state: notifyStock,  set: setNotifyStock  },
                  { label: 'Export Confirmations',  sub: 'Notify on CSV download complete',   state: notifyExport, set: setNotifyExport },
                ].map(pref => (
                  <div key={pref.label} className="profile-row">
                    <div>
                      <div className="profile-pref-title">{pref.label}</div>
                      <div className="profile-pref-sub">{pref.sub}</div>
                    </div>
                    <button
                      onClick={() => pref.set(!pref.state)}
                      className={`toggle-btn ${pref.state ? 'toggle-btn--active' : ''}`}
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card__title card__title--profile">
                  <Settings size={13} /> Display Preferences
                </div>
                <div className="profile-row">
                  <div>
                    <div className="profile-pref-title">Compact Table Mode</div>
                    <div className="profile-pref-sub">Reduce row padding in inventory grid</div>
                  </div>
                  <button
                    onClick={() => setCompactMode(!compactMode)}
                    className={`toggle-btn ${compactMode ? 'toggle-btn--active' : ''}`}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>

                <div className="profile-alert-box--success">
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={13} /> Preferences Auto-Saved
                  </div>
                  <div className="profile-pref-sub">
                    Your display settings are saved automatically and persist across sessions.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="profile-grid-2col">
              <div className="card">
                <div className="card__title card__title--profile">
                  <Key size={13} /> Password & Authentication
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Current Password</label>
                  <div className="u-relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      defaultValue="••••••••••"
                      readOnly
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="profile-password-toggle"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm btn--profile-action">
                  Change Password
                </button>

                <div className="profile-alert-box--danger">
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} /> Security Notice
                  </div>
                  <div className="profile-pref-sub" style={{ lineHeight: 1.6 }}>
                    Credentials are managed via environment configuration. Contact your infrastructure team to rotate secrets.
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card__title card__title--profile">
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
                  <div key={s.label} className="profile-row">
                    <span className="profile-row__val">{s.label}</span>
                    <span className={`profile-badge ${s.ok ? 'profile-badge--granted' : 'profile-badge--warning'}`}>
                      {s.status}
                    </span>
                  </div>
                ))}

                <button
                  className="btn btn-danger btn-sm btn--profile-danger-action"
                  onClick={handleSignOut}
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
