import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aura Engine — Enterprise Inventory Management',
  description: 'Lightning-fast inventory dashboard for enterprise logistics operations. Real-time search across 50,000+ SKUs, analytics, and export tools.',
  keywords: 'inventory management, enterprise dashboard, warehouse, SKU, analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
