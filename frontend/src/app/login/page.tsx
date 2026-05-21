'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Shield, Zap, BarChart3, Package, TrendingUp, Globe, Key } from 'lucide-react';
import { setSession } from '@/hooks/useAuthGuard';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Credentials come ONLY from environment variables — no hardcoded fallbacks.
  // Set NEXT_PUBLIC_ADMIN_EMAIL and NEXT_PUBLIC_ADMIN_PASSWORD in .env.local (never commit that file).
  const validEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '';
  const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '';
  const envMissing = !validEmail || !validPassword;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your credentials.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    if (email.trim().toLowerCase() === validEmail.toLowerCase() && password === validPassword) {
      setSession();          // mark authenticated in sessionStorage
      router.replace('/analytics'); // replace so back-button skips login
    } else {
      setError('Invalid credentials. Please check your email and password.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page { display: flex; min-height: 100vh; font-family: 'Inter', system-ui, sans-serif; background: #060912; }

        /* Left Showcase Panel */
        .login-showcase {
          flex: 1; display: flex; flex-direction: column; justify-content: center;
          padding: 60px 64px; position: relative; overflow: hidden;
          background: linear-gradient(165deg, #0c1224 0%, #111b36 40%, #0f1730 100%);
        }
        .login-showcase::before {
          content: ''; position: absolute; inset: 0; opacity: 0.4;
          background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.1) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 90%, rgba(6,182,212,0.08) 0%, transparent 50%);
        }
        .showcase-content { position: relative; z-index: 2; max-width: 520px; }
        .showcase-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
          border-radius: 20px; padding: 6px 14px; font-size: 11px; font-weight: 600;
          color: #818cf8; margin-bottom: 28px; letter-spacing: 0.03em;
        }
        .showcase-title { font-size: 38px; font-weight: 800; color: #f1f5f9; line-height: 1.15; margin-bottom: 16px; letter-spacing: -0.02em; }
        .showcase-title span { background: linear-gradient(135deg, #818cf8, #a78bfa, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .showcase-desc { font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 40px; }

        .showcase-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 40px; }
        .stat-card {
          background: rgba(15,21,48,0.6); border: 1px solid rgba(99,130,255,0.1);
          border-radius: 14px; padding: 20px; backdrop-filter: blur(8px);
          transition: border-color 0.3s, transform 0.3s;
        }
        .stat-card:hover { border-color: rgba(99,130,255,0.25); transform: translateY(-2px); }
        .stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .stat-value { font-size: 24px; font-weight: 800; color: #f1f5f9; margin-bottom: 2px; }
        .stat-label { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }

        .showcase-trust { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .trust-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; font-weight: 500; }
        .trust-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* Right Login Panel */
        .login-panel {
          width: 480px; display: flex; flex-direction: column; justify-content: center;
          padding: 60px 56px; background: #0a0e1a;
          border-left: 1px solid rgba(99,130,255,0.08);
          position: relative;
        }
        .login-panel::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #6366f1, #a855f7, #06b6d4);
        }
        .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 44px; }
        .login-logo-icon {
          width: 44px; height: 44px; background: linear-gradient(135deg, #6366f1, #a855f7);
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 30px rgba(99,102,241,0.3);
        }
        .login-logo-text { font-size: 18px; font-weight: 800; color: #f1f5f9; }
        .login-logo-sub { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }

        .login-heading { font-size: 24px; font-weight: 800; color: #f1f5f9; margin-bottom: 6px; }
        .login-subheading { font-size: 13px; color: #64748b; margin-bottom: 32px; }

        .login-field { margin-bottom: 20px; }
        .login-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
        .login-label svg { width: 13px; height: 13px; opacity: 0.6; }
        .login-input-wrap { position: relative; }
        .login-input-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #475569; pointer-events: none; }
        .login-input {
          width: 100%; background: rgba(10,14,26,0.9); border: 1px solid rgba(99,130,255,0.12);
          border-radius: 10px; padding: 13px 16px 13px 42px; color: #f1f5f9;
          font-size: 14px; font-family: inherit; outline: none; transition: all 0.25s;
        }
        .login-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .login-input::placeholder { color: #334155; }
        .login-hint {
          margin-top: 16px;
          background: rgba(99,102,241,0.06);
          border: 1px dashed rgba(99,102,241,0.2);
          border-radius: 10px;
          padding: 12px 16px;
          display: flex; flex-direction: column; gap: 7px;
          cursor: pointer; transition: background 0.2s, border-color 0.2s;
          width: 100%; text-align: left;
        }
        .login-hint:hover {
          background: rgba(99,102,241,0.11);
          border-color: rgba(99,102,241,0.4);
        }
        .login-hint-title {
          font-size: 10px; font-weight: 700; color: #6366f1;
          text-transform: uppercase; letter-spacing: 0.1em;
          display: flex; align-items: center; gap: 5px;
        }
        .login-hint-row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px;
        }
        .login-hint-label { color: #475569; }
        .login-hint-value {
          font-family: 'Courier New', monospace; color: #94a3b8;
          background: rgba(0,0,0,0.3); padding: 2px 8px;
          border-radius: 4px; font-size: 11px; letter-spacing: 0.04em;
        }

        .login-error {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #f87171;
          margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
        }

        .login-btn {
          width: 100%; padding: 14px; background: linear-gradient(135deg, #6366f1, #7c3aed);
          border: none; border-radius: 10px; color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 20px rgba(99,102,241,0.3);
          display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(99,102,241,0.4); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .login-footer { margin-top: 36px; padding-top: 24px; border-top: 1px solid rgba(99,130,255,0.08); }
        .login-footer-row { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .login-footer-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #475569; }
        .login-footer-item svg { width: 12px; height: 12px; color: #10b981; }

        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .login-showcase { display: none; }
          .login-panel { width: 100%; max-width: 460px; margin: 0 auto; border-left: none; }
          .login-page { justify-content: center; }
        }
      `}</style>
      <div className="login-page">
        {/* Left Showcase Panel */}
        <div className="login-showcase">
          <div className="showcase-content">
            <div className="showcase-badge">
              <Zap size={12} /> High-Performance Data Engineering
            </div>
            <h1 className="showcase-title">
              Manage <span>50,000+ SKUs</span> with real-time precision.
            </h1>
            <p className="showcase-desc">
              Aura Engine is a high-volume data grid dashboard designed to benchmark database aggregations. Powered by optimized MongoDB indexing and a stable React 19 UI state system.
            </p>

            <div className="showcase-stats">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <Package size={18} color="#818cf8" />
                </div>
                <div className="stat-value">50K+</div>
                <div className="stat-label">Active SKUs</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <TrendingUp size={18} color="#10b981" />
                </div>
                <div className="stat-value">&lt;100ms</div>
                <div className="stat-label">Query Speed</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>
                  <Globe size={18} color="#06b6d4" />
                </div>
                <div className="stat-value">40</div>
                <div className="stat-label">Locations</div>
              </div>
            </div>

            <div className="showcase-trust">
              <div className="trust-item"><span className="trust-dot" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} /> Optimized Indexes</div>
              <div className="trust-item"><span className="trust-dot" style={{ background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} /> Paginated Cursor</div>
              <div className="trust-item"><span className="trust-dot" style={{ background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }} /> React 19 Hooks</div>
            </div>
          </div>
        </div>

        {/* Right Login Panel */}
        <div className="login-panel">
          <div className="login-logo">
            <div className="login-logo-icon"><Package size={22} color="#fff" /></div>
            <div>
              <div className="login-logo-text">Aura Engine</div>
              <div className="login-logo-sub">Enterprise Platform</div>
            </div>
          </div>

          <div className="login-heading">Welcome back</div>
          <div className="login-subheading">Sign in to access the Inventory Command Center</div>

          {error && <div className="login-error"><Shield size={14} /> {error}</div>}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label"><Mail size={13} /> Email Address</label>
              <div className="login-input-wrap">
                <Mail />
                <input
                  type="email" className="login-input"
                  placeholder={validEmail}
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="login-field">
              <label className="login-label"><Lock size={13} /> Password</label>
              <div className="login-input-wrap">
                <Lock />
                <input
                  type="password" className="login-input"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading || envMissing}>
              {loading ? <><div className="spinner" /> Authenticating…</> : <>Sign In <ArrowRight size={16} /></>}
            </button>

            {/* Credential hint — click to auto-fill */}
            {!envMissing && (() => {
              const isFilled = email === validEmail && password === validPassword;
              return (
                <button
                  type="button"
                  className="login-hint"
                  onClick={() => { setEmail(validEmail); setPassword(validPassword); }}
                  title="Click to auto-fill credentials"
                >
                  <div className="login-hint-title">
                    <Key size={10} />
                    {isFilled
                      ? '✓ Credentials filled — click Sign In'
                      : 'Demo Credentials  •  click to fill'}
                  </div>
                  <div className="login-hint-row">
                    <span className="login-hint-label">Email</span>
                    <span className="login-hint-value">{validEmail}</span>
                  </div>
                  <div className="login-hint-row">
                    <span className="login-hint-label">Password</span>
                    <span className="login-hint-value">{validPassword}</span>
                  </div>
                </button>
              );
            })()}
          </form>

          <div className="login-footer">
            <div className="login-footer-row">
              <div className="login-footer-item"><Shield size={12} /> Express REST API</div>
              <div className="login-footer-item"><Lock size={12} /> Mongoose ODM</div>
              <div className="login-footer-item"><BarChart3 size={12} /> Zod Validation</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
