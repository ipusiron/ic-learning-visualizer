// 結果の書き出し（DOM 非依存）。CSV は Excel で開けるように BOM と CRLF、値はすべてダブルクォートで囲む

export function toCsv(header, rows) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return `\ufeff${[header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
}

export function toJson(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

// 書き出すファイル名（例: ic-learning-visualizer_periodic_20261004-0102.csv）。時刻は渡された Date から作る
export function exportName(kind, ext, date) {
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
  return `ic-learning-visualizer_${kind}_${stamp}.${ext}`;
}
