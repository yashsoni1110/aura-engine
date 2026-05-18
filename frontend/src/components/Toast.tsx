'use client';

import { useEffect } from 'react';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

export function Toast({ id, type, message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const color = type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : 'var(--accent)';

  return (
    <div
      className={`toast toast-${type}`}
      style={{ borderLeftColor: color, cursor: 'pointer' }}
      onClick={() => onDismiss(id)}
    >
      <span style={{ color, fontWeight: 700, fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{message}</span>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => <Toast key={t.id} {...t} onDismiss={onDismiss} />)}
    </div>
  );
}

let _addToast: ((t: Omit<ToastData, 'id'>) => void) | null = null;
export function setToastHandler(fn: typeof _addToast) { _addToast = fn; }
export function toast(type: ToastData['type'], message: string) {
  _addToast?.({ type, message });
}
