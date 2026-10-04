// URL の「#」より後ろ（または「?」より後ろ）で文字列と開くタブを受け取る（ほかのツールや記事から渡して開くため）。例: #text=LXFOPVEFRNHR&tab=advanced
// 「#」より後ろはサーバーへ送られず、GitHub Pages の URL の長さの上限（パスと「?」以降で8,192バイト）も受けない
// text は最初の10,000字まで（Day030・Day046 と同じ上限）。tab は learn・analyze・monte・advanced（それ以外は無視）

export const MAX_PARAM_TEXT = 10000;
export const TABS = ['learn', 'analyze', 'monte', 'advanced'];

export function readParams(search, hash = '') {
  const fromHash = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const q = fromHash.has('text') ? fromHash : new URLSearchParams(search || '');
  const raw = q.get('text');
  const text = raw !== null && raw.trim() ? raw.slice(0, MAX_PARAM_TEXT) : null;
  const tab = TABS.includes(q.get('tab')) ? q.get('tab') : null;
  return { text, tab };
}

// 読み込んだ text を「?」と「#」の両方から消したときのパス（tab などほかの値は残す）。text がなければ null。
// アドレスバー・ブックマーク・URL のコピーに暗号文を残さないため（Day017・Day030 と同じ）
export function urlWithoutText(href) {
  const url = new URL(href);
  const fromHash = new URLSearchParams(url.hash.slice(1));
  const inHash = fromHash.has('text');
  if (!url.searchParams.has('text') && !inHash) return null;
  url.searchParams.delete('text');
  fromHash.delete('text');
  const hash = inHash ? fromHash.toString() : url.hash.slice(1);
  return url.pathname + url.search + (hash ? `#${hash}` : '');
}
