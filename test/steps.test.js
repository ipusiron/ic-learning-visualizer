import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeText, icDetail, expectedRate, approxPolyIC, periodicIC, keyLengthCandidates, shiftLetters, lengthSpread, xorshift32,
  RANDOM_IC, KEY_IC_THRESHOLD, ENGLISH_KAPPA
} from '../js/ic-core.js';
import { SAMPLES, QUIZ_ANSWERS, SUMSQ_WORDS, LANGUAGE_IC } from '../js/samples.js';
import { MESSAGES } from '../js/messages.js';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ENGLISH_IC = LANGUAGE_IC.find((l) => l.id === 'english').dcode;
const corpus = fs.readFileSync(new URL('../corpus/eval-pg98.txt', import.meta.url), 'utf8').replace(/[^A-Z]/g, '');

test('ステップは8つ（1〜8が1つずつ）で、表示の「/ 8」とそろう。8つ目がクイズ', () => {
  const steps = [...html.matchAll(/<div class="step" data-step="(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(steps, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(html, /<span id="totalSteps">8<\/span>/);
  assert.match(read('script.js'), /const TOTAL_STEPS = 8;/);
  assert.ok(html.indexOf('data-step="8"') < html.indexOf('class="quiz-section"'));
});

test('ステップ5: IC＝(N×Σp²−1)÷(N−1)。HELLO は Σp²＝0.28・IC＝0.10、長い文では差が小さい', () => {
  for (const w of [...SUMSQ_WORDS, normalizeText(SAMPLES.english).text]) {
    const N = w.length;
    assert.ok(Math.abs((N * expectedRate(w, true) - 1) / (N - 1) - expectedRate(w)) < 1e-12, w.slice(0, 10));
  }
  assert.ok(Math.abs(expectedRate('HELLO', true) - 0.28) < 1e-12);
  assert.ok(Math.abs(expectedRate('HELLO') - 0.1) < 1e-12);
  const english = normalizeText(SAMPLES.english).text;
  const gap = (w) => expectedRate(w, true) - expectedRate(w);
  assert.ok(gap('HELLO') > gap('ABABAB') && gap('ABABAB') > gap(english) && gap(english) > 0 && gap(english) < 0.003);
});

test('ステップ6: 近似式は L＝1 で英語の値、L が大きいほど小さく、1/26 に近づく。式の 0.0667 は英語の値と同じ', () => {
  assert.ok(Math.abs(approxPolyIC(ENGLISH_IC, 1) - ENGLISH_IC) < 1e-12);
  let prev = Infinity;
  for (const L of [1, 2, 3, 5, 10, 20, 100]) {
    const v = approxPolyIC(ENGLISH_IC, L);
    assert.ok(v < prev && v > RANDOM_IC, String(L));
    prev = v;
  }
  assert.ok(approxPolyIC(ENGLISH_IC, 1000) - RANDOM_IC < 0.0001);
  assert.equal(ENGLISH_KAPPA, ENGLISH_IC);
  for (const lang of ['ja', 'en']) assert.ok(MESSAGES[lang]['ui.step6Formula'].includes(String(ENGLISH_IC)), lang);
});

test('ステップ7: サンプル（鍵 LEMON）は周期5と10だけが0.058以上で、鍵長の候補の1位は5', () => {
  const vig = normalizeText(SAMPLES.vigenere).text;
  const hits = periodicIC(vig, 12).filter((p) => p.ic >= KEY_IC_THRESHOLD).map((p) => p.k);
  assert.deepEqual(hits, [5, 10]);
  assert.equal(keyLengthCandidates(vig).candidates[0], 5);
  for (const lang of ['ja', 'en']) assert.ok(MESSAGES[lang]['ui.step7Demo'].includes(String(KEY_IC_THRESHOLD)), lang);
});

test('クイズ: 8問。画面の問題・選択肢・答え合わせのボタン・結果の欄が正解の表とそろう', () => {
  const ns = Object.keys(QUIZ_ANSWERS).map(Number);
  assert.deepEqual(ns, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal([...html.matchAll(/<fieldset class="quiz-item">/g)].length, ns.length);
  for (const n of ns) {
    const values = [...html.matchAll(new RegExp(`<input type="radio" name="q${n}" value="(\\w)">`, 'g'))].map((m) => m[1]);
    assert.deepEqual(values, ['a', 'b', 'c'], `q${n}`);
    assert.ok(values.includes(QUIZ_ANSWERS[n]), `q${n}`);
    assert.match(html, new RegExp(`data-quiz="${n}"`));
    assert.match(html, new RegExp(`id="result${n}" aria-live="polite"`));
    for (const lang of ['ja', 'en']) for (const r of ['correct', 'wrong']) assert.ok(`quiz.${r}${n}` in MESSAGES[lang], `${lang} ${r}${n}`);
  }
  // 正解がいつも同じ記号にならない
  assert.ok(new Set(Object.values(QUIZ_ANSWERS)).size === 3);
});

test('クイズの正解の理由がロジックで成り立つ（Q3 均等なら1/26、Q4 シーザーで IC は不変、Q6 鍵が長いと1/26へ、Q7 周期10も言語の値）', () => {
  // Q3: 26文字が1,000回ずつ
  const uniform = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(1000);
  const u = icDetail(uniform).ic;
  assert.equal(QUIZ_ANSWERS[3], 'c');
  assert.ok(Math.abs(u - 1 / 26) < 0.0001 && Math.abs(u - 0.0385) < Math.abs(u - 0.067));
  // Q4: シーザー暗号はどの文字も同じ量ずらすだけ
  assert.equal(QUIZ_ANSWERS[4], 'a');
  const plain = corpus.slice(0, 3000);
  for (const k of [1, 3, 13, 25]) assert.equal(icDetail(shiftLetters(plain, k)).ic, icDetail(plain).ic);
  // Q5: HELLO の Σp² と IC（ステップ5のテストで確認）
  assert.equal(QUIZ_ANSWERS[5], 'a');
  // Q6: 1/26 に近づく
  assert.equal(QUIZ_ANSWERS[6], 'c');
  assert.ok(approxPolyIC(ENGLISH_IC, 20) - RANDOM_IC < approxPolyIC(ENGLISH_IC, 2) - RANDOM_IC);
  // Q7: 周期10の列の IC は言語の値に近い
  assert.equal(QUIZ_ANSWERS[7], 'b');
  const p10 = periodicIC(normalizeText(SAMPLES.vigenere).text, 10).find((p) => p.k === 10).ic;
  assert.ok(Math.abs(p10 - ENGLISH_IC) < Math.abs(p10 - RANDOM_IC));
});

test('クイズ Q8 の解説「100字では1割強が0.058を下回る」: 同梱の英文で、種を変えても1割〜1割5分', () => {
  assert.equal(QUIZ_ANSWERS[8], 'c');
  for (const seed of [1, 2, 3, 4]) {
    const s = lengthSpread(corpus, 100, 2000, xorshift32(seed));
    const below = s.shares.flat + s.shares.middle;
    assert.ok(below > 0.1 && below < 0.15, `${seed}: ${below}`);
    assert.equal(s.shares.tooShort, 0);
  }
  for (const lang of ['ja', 'en']) assert.ok(MESSAGES[lang]['quiz.correct8'].includes('0.058'), lang);
});

function read(f) {
  return fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
}
