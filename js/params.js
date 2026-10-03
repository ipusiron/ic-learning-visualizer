// URL のクエリーで文字列と開くタブを受け取る（ほかのツールや記事から渡して開くため）。例: ?text=LXFOPVEFRNHR&tab=advanced
// text は最初の10,000字まで（Day030・Day046 と同じ上限）。tab は learn・analyze・monte・advanced（それ以外は無視）

export const MAX_PARAM_TEXT = 10000;
export const TABS = ['learn', 'analyze', 'monte', 'advanced'];

export function readParams(search) {
  const q = new URLSearchParams(search || '');
  const raw = q.get('text');
  const text = raw !== null && raw.trim() ? raw.slice(0, MAX_PARAM_TEXT) : null;
  const tab = TABS.includes(q.get('tab')) ? q.get('tab') : null;
  return { text, tab };
}
