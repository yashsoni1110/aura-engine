'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, LayoutGrid, LogOut, Package, Wifi, UserCircle } from 'lucide-react';
import { clearSession } from '@/hooks/useAuthGuard';

const navItems = [
  {
    href: '/analytics',
    label: 'Command Center',
    icon: BarChart3,
    desc: 'Overview & KPIs',
  },
  {
    href: '/inventory',
    label: 'Inventory Grid',
    icon: LayoutGrid,
    desc: '50,000 SKUs',
  },
];

/** Derive initials from a display name: "Aura Admin" → "AA" */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router  = useRouter();

  const adminName  = process.env.NEXT_PUBLIC_ADMIN_NAME  || 'Admin';
  const adminRole  = process.env.NEXT_PUBLIC_ADMIN_ROLE  || 'Administrator';
  const initials   = getInitials(adminName);

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };
  const isProfileActive = pathname === '/profile';

  return (
    <aside className="sidebar">
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon"><Package size={18} color="#fff" /></div>
        <div>
          <div className="sidebar__logo-text">Aura Engine</div>
          <div className="sidebar__logo-sub">Enterprise v2.0</div>
        </div>
      </div>

      {/* ── Workspace badge ──────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Workspace</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Enterprise Client</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Midwest USA · Multi-location retail</div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="sidebar__nav">
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 4px 4px', fontWeight: 700 }}>Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <Icon size={18} style={{ minWidth: 18, opacity: 0.85 }} />
              <div>
                <div>{item.label}</div>
                <div style={{ fontSize: 10, color: 'inherit', opacity: 0.6, marginTop: 1 }}>{item.desc}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="sidebar__footer">
        {/* DB status */}
        <div style={{ marginBottom: 8 }}>
          <div className="sidebar__status">
            <span className="status-dot" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Wifi size={10} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>MongoDB Atlas</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Connected · Live</div>
            </div>
          </div>
        </div>

        {/* ── Profile row ── clickable → /profile */}
        <div style={{ padding: '8px 0 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href="/profile"
            title="View profile"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, flex: 1,
              borderRadius: 8, padding: '4px 6px',
              background: isProfileActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              border: isProfileActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              transition: 'background 0.2s, border-color 0.2s',
              cursor: 'pointer', textDecoration: 'none',
            }}
            className="profile-row-link"
          >
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
              boxShadow: isProfileActive ? '0 0 10px rgba(99,102,241,0.4)' : 'none',
              transition: 'box-shadow 0.2s',
            }}>
              {initials}
            </div>

            {/* Name & role */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: isProfileActive ? 'var(--accent-light)' : 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }}>
                {adminName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {adminRole}
              </div>
            </div>

            {/* Profile icon */}
            <UserCircle size={14} color={isProfileActive ? 'var(--accent-light)' : 'var(--text-muted)'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
