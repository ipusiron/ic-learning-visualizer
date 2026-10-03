// 一致指数（IC）の計算と、学習・実験・鍵長推定に使うロジック（DOM 非依存）
// IC = Σ n_i(n_i − 1) / N(N − 1)。テキストから2文字を（同じ位置を選ばずに）選んだとき、同じ文字である確率

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const MAX_TEXT = 100000;
export const RANDOM_IC = 1 / 26;
export const MAX_PERIOD = 20;
// 列の平均ICがこの値以上の周期を、鍵長の候補として先に並べる（Day044・046 と同じ）
export const KEY_IC_THRESHOLD = 0.058;
// 判定の区分（ref/day047/classify.json の実測で決めた）: 平坦＜0.046≦中間＜0.058≦言語らしい＜0.10≦偏り
export const BANDS = { middle: 0.046, language: 0.058, skewed: 0.1 };
// 50字未満は判定しない。200字未満は「短い文なので外れやすい」と添える
export const MIN_VERDICT = 50;
export const SHORT_BELOW = 200;

// テキストを分析用に整える。
// lettersOnly: 全角は半角に、アクセント記号は外して基底の字に（Ü→U、ß→SS）、大文字の A〜Z だけを残す
// lettersOnly でないとき: 大文字にするだけ。removeSpaces なら空白・句読点・記号を除く
export function normalizeText(text, { lettersOnly = true, removeSpaces = true } = {}) {
  const src = String(text ?? '');
  if (lettersOnly) {
    let out = '';
    let ignored = 0;
    for (const ch of src.normalize('NFKC').normalize('NFD')) {
      if (/\p{M}/u.test(ch) || /\s/u.test(ch)) continue;
      const up = ch.toUpperCase();
      if (/^[A-Z]+$/.test(up)) out += up;
      else ignored += 1;
    }
    return { text: out, ignored };
  }
  const up = src.toUpperCase();
  const out = removeSpaces ? up.replace(/[\s\p{P}\p{S}]/gu, '') : up;
  return { text: out, ignored: [...up].length - [...out].length };
}

// 文字（コードポイント）ごとの出現回数。現れた順の Map
export function countChars(text) {
  const counts = new Map();
  for (const ch of text) counts.set(ch, (counts.get(ch) || 0) + 1);
  return counts;
}

// A〜Z の出現回数（長さ26の配列）。A〜Z 以外の文字の数は other に
export function letterCounts(text) {
  const counts = new Array(26).fill(0);
  let other = 0;
  for (const ch of text) {
    const k = ch.charCodeAt(0) - 65;
    if (ch.length === 1 && k >= 0 && k < 26) counts[k] += 1;
    else other += 1;
  }
  return { counts, other };
}

// IC と、その計算の内訳。N はテキストの文字数（数えた文字すべて）
export function icDetail(text) {
  const counts = countChars(text);
  let N = 0;
  let pairs = 0;
  for (const n of counts.values()) {
    N += n;
    pairs += n * (n - 1);
  }
  const denom = N * (N - 1);
  return { N, pairs, denom, ic: denom > 0 ? pairs / denom : 0, counts };
}

export function indexOfCoincidence(text) {
  return icDetail(text).ic;
}

// 計算表の行（出現した文字だけ、文字の順）: { ch, n, pairs }
export function breakdownRows(text) {
  const rows = [...countChars(text)].map(([ch, n]) => ({ ch, n, pairs: n * (n - 1) }));
  return rows.sort((a, b) => (a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : 0));
}

// テキストを周期 L で列に分ける（列 j は j, j+L, j+2L, … 文字目）
export function columnsOf(text, L) {
  const cols = Array.from({ length: L }, () => '');
  let i = 0;
  for (const ch of text) {
    cols[i % L] += ch;
    i += 1;
  }
  return cols;
}

// 周期 k（1〜max）で列に分けたときの、列の IC の平均。2文字以上の列だけで平均する。{ k, ic, shortest }
export function periodicIC(text, max = MAX_PERIOD) {
  const out = [];
  for (let k = 1; k <= max; k++) {
    let sum = 0;
    let cols = 0;
    let shortest = Infinity;
    for (const col of columnsOf(text, k)) {
      const n = [...col].length;
      if (n < 2) continue;
      sum += indexOfCoincidence(col);
      cols += 1;
      shortest = Math.min(shortest, n);
    }
    if (cols) out.push({ k, ic: sum / cols, shortest });
  }
  return out;
}

// 鍵長の候補（周期2以上）: 平均がしきい値以上の周期を小さい順に先に、続いて残りを平均の大きい順に。
// 平均の大きい順だけで並べると、列が短く値の揺れる鍵長の倍数が1位に来やすい（ref/day047/keylen.json）
export function keyLengthCandidates(text, max = MAX_PERIOD) {
  const all = periodicIC(text, max);
  const curve = all.filter((p) => p.k >= 2);
  const hits = curve.filter((p) => p.ic >= KEY_IC_THRESHOLD).map((p) => p.k);
  const rest = [...curve].sort((a, b) => b.ic - a.ic || a.k - b.k).map((p) => p.k).filter((k) => !hits.includes(k));
  const one = all.find((p) => p.k === 1);
  return { candidates: [...hits, ...rest], curve, periodFound: hits.length > 0, whole: one ? one.ic : 0 };
}

// IC の区分。N が MIN_VERDICT 未満なら判定しない。{ band, short }
export function classifyIC(ic, N) {
  if (N < MIN_VERDICT) return { band: 'tooShort', short: true };
  let band = 'flat';
  if (ic >= BANDS.skewed) band = 'skewed';
  else if (ic >= BANDS.language) band = 'language';
  else if (ic >= BANDS.middle) band = 'middle';
  return { band, short: N < SHORT_BELOW };
}

// 決まった種から同じ並びを出す乱数（xorshift32）。0 以上 1 未満
export function xorshift32(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

// モンテカルロの1回: 位置を2つ選ぶ。replacement が false なら同じ位置を選ばない（IC の定義どおり）
export function pickPair(N, rng, replacement = false) {
  const a = Math.floor(rng() * N);
  if (replacement) return [a, Math.floor(rng() * N)];
  let b = Math.floor(rng() * (N - 1));
  if (b >= a) b += 1;
  return [a, b];
}

// n 回の試行。chars はコードポイントの配列。{ matches, last: { pos1, pos2, char1, char2, match } }
export function runTrials(chars, n, rng, replacement = false) {
  let matches = 0;
  let last = null;
  for (let i = 0; i < n; i++) {
    const [pos1, pos2] = pickPair(chars.length, rng, replacement);
    const match = chars[pos1] === chars[pos2];
    if (match) matches += 1;
    last = { pos1, pos2, char1: chars[pos1], char2: chars[pos2], match };
  }
  return { matches, last };
}

// 試行が収束する先: 同じ位置を選ばないなら IC、選んでよいなら Σ(n_i/N)²
export function expectedRate(text, replacement = false) {
  const { N, counts, ic } = icDetail(text);
  if (!replacement) return ic;
  let s = 0;
  for (const n of counts.values()) s += (n / N) ** 2;
  return N ? s : 0;
}

// 割合 p を n 回の試行で求めたときの標準誤差
export function standardError(p, n) {
  return n > 0 ? Math.sqrt((p * (1 - p)) / n) : 0;
}

// 収束グラフに点を記録する間隔（どの回数でも100点前後になるように）
export function historyStep(total) {
  return Math.max(1, Math.ceil(total / 100));
}

// グラフの縦軸の上限: 0.1 を下限に、値の最大の1.1倍を 0.02 刻みで切り上げる
export function chartMax(values) {
  const m = Math.max(0, ...values.filter((v) => Number.isFinite(v)));
  return Math.max(0.1, Math.ceil((m * 1.1) / 0.02 - 1e-9) * 0.02);
}

// 英字を k だけずらす（大文字・小文字を保ち、英字以外はそのまま）
export function shiftLetters(text, k) {
  return String(text).replace(/[A-Za-z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + k) % 26 + 26) % 26 + base);
  });
}

// ヴィジュネル暗号（A＝0）。英字だけを鍵で暗号化して大文字にし、英字以外はそのまま残す。鍵は英字のときだけ進む
export function encryptVigenere(text, key) {
  const k = normalizeText(key).text;
  if (!k) return String(text).toUpperCase();
  let i = 0;
  return String(text).replace(/[A-Za-z]/g, (c) => {
    const p = c.toUpperCase().charCodeAt(0) - 65;
    const out = String.fromCharCode(((p + k.charCodeAt(i % k.length) - 65) % 26) + 65);
    i += 1;
    return out;
  });
}

export function formatIC(x) {
  return Number.isFinite(x) ? x.toFixed(4) : '0.0000';
}

// 多表式暗号（鍵長 L、鍵の文字がばらばら）の IC の近似: (κp + (L−1)κr) / L。κp は平文の IC、κr は 1/26
export function approxPolyIC(kp, L, kr = RANDOM_IC) {
  return (kp + (L - 1) * kr) / L;
}

// 鍵長とICの実験: A〜Z の平文を、鍵長 L ごとに trials 個のランダムな鍵で暗号化し、暗号文の IC の平均を近似式と並べる
// { kp, rows: [{ L, measured, approx }] }
export function keyLengthExperiment(plain, lengths, rng, trials = 10) {
  const kp = indexOfCoincidence(plain);
  const rows = lengths.map((L) => {
    let sum = 0;
    for (let t = 0; t < trials; t++) {
      let key = '';
      for (let i = 0; i < L; i++) key += ALPHABET[Math.floor(rng() * 26)];
      sum += indexOfCoincidence(encryptVigenere(plain, key));
    }
    return { L, measured: sum / trials, approx: approxPolyIC(kp, L) };
  });
  return { kp, rows };
}

// 割合 p を n 回の試行で求めたときの、ばらつきの目安の帯（p ± k×標準誤差、0〜1 に収める）
export function sigmaBand(p, n, k = 2) {
  const d = k * standardError(p, n);
  return [Math.max(0, p - d), Math.min(1, p + d)];
}
