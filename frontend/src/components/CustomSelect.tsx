'use client';

import { useEffect, useRef, useState } from 'react';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  id?: string;
  placeholder?: string;
  minWidth?: number;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  id,
  placeholder = 'Select…',
  minWidth = 180,
}: CustomSelectProps) {
  const [open, setOpen]     = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const selected            = options.find(o => o.value === value);

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <style>{`
        .cselect-wrap    { position: relative; display: inline-block; width: 100%; }
        .cselect-trigger {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 9px 12px; gap: 10px;
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text-primary);
          font-size: 13px; font-family: inherit; cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          user-select: none; outline: none;
        }
        .cselect-trigger:hover {
          border-color: rgba(99,102,241,0.45);
          background: rgba(99,102,241,0.05);
        }
        .cselect-trigger.open {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .cselect-arrow {
          width: 14px; height: 14px; flex-shrink: 0; color: #6366f1;
          transition: transform 0.25s ease;
        }
        .cselect-arrow.open { transform: rotate(180deg); }

        /* ── Dropdown panel ── */
        .cselect-panel {
          position: absolute; top: calc(100% + 6px); left: 0;
          min-width: 100%; z-index: 999;
          background: #0f1728;
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.08);
          overflow: hidden;
          /* slide-from-side animation */
          transform-origin: top left;
          animation: csSlide 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes csSlide {
          from { opacity: 0; transform: translateX(-12px) scaleX(0.96) scaleY(0.94); }
          to   { opacity: 1; transform: translateX(0)     scaleX(1)    scaleY(1);    }
        }

        /* ── Option rows ── */
        .cselect-option {
          display: flex; align-items: center; padding: 11px 16px;
          font-size: 13px; color: var(--text-secondary);
          border-bottom: 1px solid rgba(99,102,241,0.07);
          cursor: pointer; transition: background 0.15s, color 0.15s, padding-left 0.15s;
          white-space: nowrap;
        }
        .cselect-option:last-child { border-bottom: none; }
        .cselect-option:hover {
          background: rgba(99,102,241,0.1);
          color: #818cf8;
          padding-left: 20px;          /* subtle nudge on hover */
        }
        .cselect-option.selected {
          color: #818cf8; font-weight: 600;
          background: rgba(99,102,241,0.08);
        }
        .cselect-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent); margin-right: 10px;
          opacity: 0; transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .cselect-option.selected .cselect-dot { opacity: 1; }
      `}</style>

      <div className="cselect-wrap" ref={ref} style={{ minWidth }}>
        <button
          id={id}
          type="button"
          className={`cselect-trigger${open ? ' open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{selected?.label ?? placeholder}</span>
          <svg className={`cselect-arrow${open ? ' open' : ''}`} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="cselect-panel" role="listbox">
            {options.map(opt => (
              <div
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`cselect-option${opt.value === value ? ' selected' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span className="cselect-dot" />
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
