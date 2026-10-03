// 鍵長推定の結果から、暗号文を渡してほかのツールで続けるリンク（DOM 非依存）
// いずれも「生成AIで作るセキュリティツール100」のツール。受け取り方は各ツールの README の仕様に合わせる
//   Day030 Modular Text Divider ?text=…&n=…（10,000字まで、n は1〜20。周期 n で列に分ける）
//   Day046 AlphaLoom            ?text=…&n=…（10,000字まで、n は1〜20。鍵の英単語を探す）
//   Day017 Vigenère Cipher Tool ?text=（入力欄に読み込む）
//   Day009 Frequency Analyzer   ?text=（5,000字まで。読み込むと頻度分析を実行）

export const BASE = 'https://ipusiron.github.io/';
export const MAX_PERIOD = 20;

export const TOOLS = [
  { id: 'divider', key: 'links.divider', path: 'modular-text-divider/', max: 10000, needsPeriod: true },
  { id: 'alphaloom', key: 'links.alphaloom', path: 'alphaloom/', max: 10000, needsPeriod: true },
  { id: 'vigenere', key: 'links.vigenere', path: 'vigenere-cipher-tool/', max: 100000, needsPeriod: false },
  { id: 'frequency', key: 'links.frequency', path: 'frequency-analyzer/', max: 5000, needsPeriod: false }
];

// letters＝英字だけの暗号文、period＝鍵長の候補の1位（なければ null）。
// 渡せないとき（長すぎる・鍵長がない）は、文字列を付けずにツールのページを開くリンクにする（passed: false）
export function buildToolLinks(letters, period = null) {
  const usablePeriod = Number.isInteger(period) && period >= 1 && period <= MAX_PERIOD;
  return TOOLS.map((tool) => {
    const href = BASE + tool.path;
    const tooLong = letters.length > tool.max;
    if (!letters || tooLong || (tool.needsPeriod && !usablePeriod)) {
      return { id: tool.id, key: tool.key, href, passed: false, reason: tooLong ? 'tooLong' : !letters ? 'empty' : 'noPeriod', max: tool.max };
    }
    const params = new URLSearchParams();
    params.set('text', letters);
    if (tool.needsPeriod) params.set('n', String(period));
    return { id: tool.id, key: tool.key, href: `${href}?${params.toString()}`, passed: true, reason: null, max: tool.max };
  });
}
