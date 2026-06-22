const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];

const THAI_MONTHS_SHORT = THAI_MONTHS.map((m) => m.slice(0, 3));

export function fmtTHB(n: number): string {
  return '฿' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return THAI_MONTHS[m - 1] + ' ' + (y + 543);
}

export function monthLabelShort(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return THAI_MONTHS_SHORT[m - 1] + ' ' + String(y + 543).slice(2);
}

export function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.getDate() + ' ' + THAI_MONTHS_SHORT[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
