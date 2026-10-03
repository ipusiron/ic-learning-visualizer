import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText, countChars, letterCounts, icDetail, indexOfCoincidence, breakdownRows, columnsOf, periodicIC, keyLengthCandidates,
  classifyIC, xorshift32, pickPair, runTrials, expectedRate, standardError, historyStep, chartMax, shiftLetters, encryptVigenere,
  formatIC, KEY_IC_THRESHOLD, BANDS, MIN_VERDICT, SHORT_BELOW, RANDOM_IC
} from '../js/ic-core.js';

const near = (a, b, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('IC の既知解答: Σn(n−1)/N(N−1)', () => {
  near(indexOfCoincidence('HELLO'), 2 / 20);
  near(indexOfCoincidence('ABCDEFGHIJ'), 0);
  near(indexOfCoincidence('AABCDEFGHI'), 2 / 90);
  near(indexOfCoincidence('AABBCCDDEE'), 10 / 90);
  near(indexOfCoincidence('AAAAAABBCD'), 32 / 90);
  near(indexOfCoincidence('AAAAAA'), 1);
  near(indexOfCoincidence('ABABAB'), 12 / 30);
  assert.equal(indexOfCoincidence(''), 0);
  assert.equal(indexOfCoincidence('A'), 0);
  assert.equal(formatIC(32 / 90), '0.3556');
  assert.equal(formatIC(NaN), '0.0000');
});

test('IC の内訳（HELLO: N=5、分母20、分子2）と計算表の行', () => {
  const d = icDetail('HELLO');
  assert.deepEqual([d.N, d.denom, d.pairs], [5, 20, 2]);
  assert.deepEqual(breakdownRows('HELLO'), [
    { ch: 'E', n: 1, pairs: 0 }, { ch: 'H', n: 1, pairs: 0 }, { ch: 'L', n: 2, pairs: 2 }, { ch: 'O', n: 1, pairs: 0 }
  ]);
  assert.deepEqual([...countChars('ABA')], [['A', 2], ['B', 1]]);
});

test('正規化（A〜Zのみ）: 全角は半角、アクセント記号は外す、ß は SS、英字以外は数えて捨てる', () => {
  assert.deepEqual(normalizeText('Ｈｅｌｌｏ, World!'), { text: 'HELLOWORLD', ignored: 2 });
  assert.equal(normalizeText('Über café Straße').text, 'UBERCAFESTRASSE');
  assert.deepEqual(normalizeText('暗号 ABC 123'), { text: 'ABC', ignored: 5 });
  assert.equal(normalizeText('a\tb\nc\u3000d').text, 'ABCD');
});

test('正規化（A〜Zのみでない）: 大文字にするだけ。空白・記号を除く指定で空白・句読点・記号を消す', () => {
  assert.equal(normalizeText('Über, café!', { lettersOnly: false, removeSpaces: true }).text, 'ÜBERCAFÉ');
  assert.equal(normalizeText('Ab c', { lettersOnly: false, removeSpaces: false }).text, 'AB C');
  // N は数えた文字すべて。A〜Z 以外も出現回数に入るので、IC が A〜Z だけを数えて下がることはない
  const d = icDetail('ÜÜAB');
  assert.deepEqual([d.N, d.pairs], [4, 2]);
  near(d.ic, 2 / 12);
});

test('A〜Z の出現回数とそれ以外の数', () => {
  const { counts, other } = letterCounts('AAZ!Ü');
  assert.equal(counts[0], 2);
  assert.equal(counts[25], 1);
  assert.equal(other, 2);
});

test('列への分け方と周期ごとの IC（2文字未満の列は平均に入れない）', () => {
  assert.deepEqual(columnsOf('ABCDEFG', 3), ['ADG', 'BE', 'CF']);
  const p = periodicIC('AAAABBBB', 4);
  assert.deepEqual(p.map((x) => x.k), [1, 2, 3, 4]);
  near(p[0].ic, indexOfCoincidence('AAAABBBB'));
  near(p[1].ic, (indexOfCoincidence('AABB') + indexOfCoincidence('AABB')) / 2);
  // ABC: 周期1は ABC、周期2は AC（B は1文字なので外す）、周期3以上は全列1文字なので出さない
  assert.deepEqual(periodicIC('ABC', 20).map((x) => x.k), [1, 2]);
});

test('鍵長の候補: しきい値以上の最小の周期が先、倍数はそのあと。周期1は whole に分けて返す', () => {
  const plain = 'THEINDEXOFCOINCIDENCEMEASURESHOWOFTENTWOLETTERSPICKEDATRANDOMFROMATEXTARETHESAMEENGLISHTEXT'.repeat(4);
  const c = encryptVigenere(plain, 'LEMON').replace(/[^A-Z]/g, '');
  const r = keyLengthCandidates(c);
  assert.equal(r.candidates[0], 5);
  assert.ok(r.periodFound);
  assert.ok(!r.candidates.includes(1));
  assert.ok(r.curve.find((p) => p.k === 5).ic >= KEY_IC_THRESHOLD);
  assert.ok(r.whole < KEY_IC_THRESHOLD);
});

test('IC の区分（50字未満は判定しない、200字未満は短い印）', () => {
  assert.deepEqual(classifyIC(0.07, MIN_VERDICT - 1), { band: 'tooShort', short: true });
  assert.deepEqual(classifyIC(0.07, 100), { band: 'language', short: true });
  assert.deepEqual(classifyIC(0.07, SHORT_BELOW), { band: 'language', short: false });
  assert.equal(classifyIC(BANDS.middle - 1e-9, 500).band, 'flat');
  assert.equal(classifyIC(BANDS.middle, 500).band, 'middle');
  assert.equal(classifyIC(BANDS.language, 500).band, 'language');
  assert.equal(classifyIC(BANDS.skewed, 500).band, 'skewed');
  assert.equal(classifyIC(RANDOM_IC, 500).band, 'flat');
});

test('乱数は決まった種で同じ並び、0以上1未満', () => {
  const a = xorshift32(7);
  const b = xorshift32(7);
  for (let i = 0; i < 1000; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test('位置の選び方: 同じ位置を選ばない（非復元）。どの位置も選ばれる', () => {
  const rng = xorshift32(1);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const [a, b] = pickPair(5, rng);
    assert.notEqual(a, b);
    assert.ok(a >= 0 && a < 5 && b >= 0 && b < 5);
    seen.add(`${a}${b}`);
  }
  assert.equal(seen.size, 20);
  const r2 = xorshift32(2);
  let same = 0;
  for (let i = 0; i < 2000; i++) {
    const [a, b] = pickPair(5, r2, true);
    if (a === b) same += 1;
  }
  assert.ok(same > 200 && same < 600, String(same));
});

test('モンテカルロの試行は理論値（IC）に収束する（標準誤差の4倍以内）。復元抽出なら Σp² に', () => {
  const text = [...'THEQUICKBROWNFOXJUMPSOVERTHELAZYDOGANDKEEPSRUNNINGTHROUGHTHEFIELD'];
  const n = 200000;
  const r = runTrials(text, n, xorshift32(3));
  const ic = indexOfCoincidence(text.join(''));
  assert.ok(Math.abs(r.matches / n - ic) < 4 * standardError(ic, n));
  const rr = runTrials(text, n, xorshift32(4), true);
  const sp = expectedRate(text.join(''), true);
  assert.ok(sp > ic);
  assert.ok(Math.abs(rr.matches / n - sp) < 4 * standardError(sp, n));
  assert.equal(typeof r.last.match, 'boolean');
  near(expectedRate('AB', true), 0.5);
  near(expectedRate('AB'), 0);
});

test('標準誤差・グラフの点の間隔・縦軸の上限', () => {
  near(standardError(0.5, 100), 0.05);
  assert.equal(standardError(0.5, 0), 0);
  assert.deepEqual([historyStep(100), historyStep(150), historyStep(1000), historyStep(100000)], [1, 2, 10, 1000]);
  near(chartMax([0.0651]), 0.1);
  near(chartMax([0.1973]), 0.22);
  near(chartMax([]), 0.1);
});

test('シーザー・ヴィジュネルの既知解答（Wikipedia の ATTACKATDAWN／LEMON）と往復', () => {
  assert.equal(encryptVigenere('ATTACKATDAWN', 'LEMON'), 'LXFOPVEFRNHR');
  assert.equal(encryptVigenere('attack at dawn!', 'lemon'), 'LXFOPV EF RNHR!');
  assert.equal(shiftLetters('Abc, xyz', 3), 'Def, abc');
  assert.equal(shiftLetters(shiftLetters('Hello World', 7), -7), 'Hello World');
  assert.equal(encryptVigenere('ABC', ''), 'ABC');
});
