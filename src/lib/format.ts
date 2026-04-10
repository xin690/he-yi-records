export function formatAmount(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000) {
    const formatted = (absAmount / 10000).toFixed(1);
    const value = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
    return (amount >= 0 ? '' : '-') + value + '万';
  }
  if (Number.isInteger(absAmount)) {
    return amount.toLocaleString('zh-CN');
  }
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
