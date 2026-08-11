import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Settings } from '../types';
import { formatCurrency } from './helpers';

export function exportProductsPdf(products: Product[], settings: Settings) {
  const doc = new jsPDF();
  const currency = settings.currency;

  const formatDate = (d?: Date) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString();
  };

  const title = 'Stash Sage';
  const subtitle = `${products.length} products`;

  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 14, 27);
  doc.setTextColor(0);

  const totalValue = products.reduce((s, p) => s + (p.price || 0) * p.amount, 0);
  const totalAmount = products.reduce((s, p) => s + p.amount, 0);

  doc.setFontSize(10);
  doc.text(`Total Value: ${formatCurrency(totalValue, currency)}`, 14, 34);
  doc.text(`Total Weight: ${totalAmount.toFixed(1)}g`, 80, 34);

  const body = products.map((p) => [
    p.name,
    p.type,
    p.brand || '—',
    `${p.amount.toFixed(1)}g`,
    formatCurrency(p.price, currency),
    p.thc ? `${p.thc}%` : '—',
    p.rating > 0 ? p.rating.toFixed(1) : '—',
    formatDate(p.purchasedAt),
    formatDate(p.createdAt),
  ]);

  autoTable(doc, {
    head: [['Name', 'Type', 'Brand', 'Amount', 'Price', 'THC', 'Rating', 'Purchased', 'Created']],
    body,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [6, 182, 212], fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`stash-sage-${new Date().toISOString().slice(0, 10)}.pdf`);
}
