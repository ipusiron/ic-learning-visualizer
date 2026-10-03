import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, icDetail, classifyIC, keyLengthCandidates, shiftLetters, encryptVigenere, RANDOM_IC } from '../js/ic-core.js';
import {
  SAMPLES, SAMPLE_ORDER, CAESAR_PLAIN, CAESAR_SHIFT, VIGENERE_PLAIN, VIGENERE_KEY, RANDOM_LENGTH, STEP3_PATTERNS, QUIZ1_OPTIONS,
  LANGUAGE_IC, randomLetters
} from '../js/samples.js';

const analyze = (raw) => {
  const text = normalizeText(raw).text;
  const d = icDetail(text);
  return { text, ...d, band: classifyIC(d.ic, d.N).band };
};

test('サンプルの区分: 英語・独・仏・シーザーは言語らしい、ランダム・ヴィジュネルは平坦、繰り返しは偏り', () => {
  const want = { english: 'language', random: 'flat', caesar: 'language', vigenere: 'flat', german: 'language', french: 'language', repeated: 'skewed' };
  assert.deepEqual(SAMPLE_ORDER, Object.keys(want));
  for (const [k, band] of Object.entries(want)) assert.equal(analyze(SAMPLES[k]).band, band, k);
});

test('シーザー暗号のサンプルは平文を3ずらしたもので、IC は平文と同じ', () => {
  assert.equal(shiftLetters(SAMPLES.caesar, -CAESAR_SHIFT), CAESAR_PLAIN);
  assert.equal(analyze(SAMPLES.caesar).ic, analyze(CAESAR_PLAIN).ic);
});

test('ヴィジュネル暗号のサンプルは鍵 LEMON の本物の暗号文（1つのずらしでは戻らない）で、鍵長の候補の1位は5', () => {
  assert.equal(SAMPLES.vigenere, encryptVigenere(VIGENERE_PLAIN, VIGENERE_KEY));
  const plain = analyze(VIGENERE_PLAIN);
  const c = analyze(SAMPLES.vigenere);
  assert.ok(c.ic < plain.ic - 0.02, `${c.ic} ${plain.ic}`);
  for (let k = 0; k < 26; k++) assert.notEqual(normalizeText(shiftLetters(SAMPLES.vigenere, -k)).text, plain.text);
  assert.equal(keyLengthCandidates(c.text).candidates[0], VIGENERE_KEY.length);
});

test('ランダムのサンプルは一様乱数の300字（決まった種）で、IC は 1/26 に近い', () => {
  assert.equal(SAMPLES.random, randomLetters());
  assert.equal(SAMPLES.random.length, RANDOM_LENGTH);
  assert.match(SAMPLES.random, /^[A-Z]+$/);
  assert.ok(Math.abs(analyze(SAMPLES.random).ic - RANDOM_IC) < 0.003);
  assert.notEqual(randomLetters(1), SAMPLES.random);
});

test('ステップ3の例は IC が小さい順に並び、すべて違う文字の例は0', () => {
  const ics = STEP3_PATTERNS.map((p) => icDetail(p).ic);
  assert.equal(ics[0], 0);
  for (let i = 1; i < ics.length; i++) assert.ok(ics[i] > ics[i - 1]);
  assert.ok(STEP3_PATTERNS.every((p) => p.length === 10));
});

test('クイズ1の正解（b: AAAAAA）は IC が最も高い', () => {
  const ics = Object.fromEntries(Object.entries(QUIZ1_OPTIONS).map(([k, v]) => [k, icDetail(v).ic]));
  assert.equal(Object.keys(ics).sort((a, b) => ics[b] - ics[a])[0], 'b');
});

test('言語別の IC の表: 正規化値÷26 が dCode の値と0.003以内（出典の違いはその程度）', () => {
  assert.equal(LANGUAGE_IC[0].id, 'english');
  for (const l of LANGUAGE_IC) {
    if (l.dcode === null) continue;
    assert.ok(Math.abs(l.friedman / 26 - l.dcode) < 0.003, l.id);
  }
});
