// 暗号の種類と IC の比較に使う古典暗号（DOM 非依存）。入力も出力も A〜Z の文字列
// 単一換字・列転置は文字の出現回数の組み合わせを変えない（IC は平文と同じ）。ヴィジュネル・自動鍵は出現回数を平らにする

import { ALPHABET, encryptVigenere, indexOfCoincidence, keyLengthCandidates, KEY_IC_THRESHOLD } from './ic-core.js';

export function randomKey(length, rng) {
  let key = '';
  for (let i = 0; i < length; i++) key += ALPHABET[Math.floor(rng() * 26)];
  return key;
}

function shuffled(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 単一換字: ランダムな対応表（26文字の並べ替え）で置き換える
export function substitution(plain, rng) {
  const key = shuffled(ALPHABET.split(''), rng).join('');
  return { text: [...plain].map((ch) => key[ch.charCodeAt(0) - 65]).join(''), key };
}

// 列転置: 幅 width の表に横に書き、ランダムな列の順に縦に読む
export function columnar(plain, width, rng) {
  const order = shuffled([...Array(width).keys()], rng);
  let text = '';
  for (const c of order) for (let i = c; i < plain.length; i += width) text += plain[i];
  return { text, order };
}

// 自動鍵暗号: 鍵（primer）のあとに平文そのものを続けた列を鍵にする
export function autokey(plain, primer) {
  const stream = primer + plain;
  let text = '';
  for (let i = 0; i < plain.length; i++) text += ALPHABET[(plain.charCodeAt(i) - 65 + stream.charCodeAt(i) - 65) % 26];
  return { text, key: primer };
}

export function autokeyDecrypt(cipher, primer) {
  let plain = '';
  for (let i = 0; i < cipher.length; i++) {
    const k = i < primer.length ? primer.charCodeAt(i) - 65 : plain.charCodeAt(i - primer.length) - 65;
    plain += ALPHABET[(cipher.charCodeAt(i) - 65 - k + 26) % 26];
  }
  return plain;
}

// 同じ平文を5つの方式で暗号化し、IC と周期ICの鍵長の候補（1位、しきい値を超えた周期がなければ null）を並べる
export const COMPARE_IDS = ['plain', 'substitution', 'columnar', 'vigenere', 'autokey'];

export function compareCiphers(plain, rng, { vigenereLength = 5, columnarWidth = 7, autokeyLength = 5 } = {}) {
  const make = {
    plain: () => ({ text: plain, key: '' }),
    substitution: () => substitution(plain, rng),
    columnar: () => columnar(plain, columnarWidth, rng),
    vigenere: () => {
      const key = randomKey(vigenereLength, rng);
      return { text: encryptVigenere(plain, key), key };
    },
    autokey: () => autokey(plain, randomKey(autokeyLength, rng))
  };
  return COMPARE_IDS.map((id) => {
    const r = make[id]();
    const k = keyLengthCandidates(r.text);
    // 分けなくても全体の IC が高い（平文・単一換字・転置）なら 1。周期が見つからなければ null
    const period = k.whole >= KEY_IC_THRESHOLD ? 1 : k.periodFound ? k.candidates[0] : null;
    return { id, text: r.text, ic: indexOfCoincidence(r.text), period };
  });
}
