import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  kappa, kappaCurve, columnDetails, friedmanEstimate, parseSeed, makeRng, encryptVigenere, indexOfCoincidence, MIN_COLUMN_LETTERS, ENGLISH_KAPPA,
  RANDOM_IC
} from '../js/ic-core.js';
import { toCsv, toJson, exportName } from '../js/export.js';

const corpus = fs.readFileSync(new URL('../corpus/eval-pg98.txt', import.meta.url), 'utf8').replace(/[^A-Z]/g, '');

test('κテスト: ずらして重ねて一致する割合（ABCABCABC は3ずらすと全部一致、1ずらすと0）', () => {
  assert.deepEqual(kappa('ABCABCABC', 3), { k: 3, rate: 1, matches: 6, overlap: 6 });
  assert.deepEqual(kappa('ABCABCABC', 1), { k: 1, rate: 0, matches: 0, overlap: 8 });
  assert.deepEqual(kappa('AB', 5), { k: 5, rate: 0, matches: 0, overlap: 0 });
  const curve = kappaCurve('A'.repeat(30));
  assert.equal(curve.length, Math.floor(30 / MIN_COLUMN_LETTERS));
  assert.ok(curve.every((p) => p.rate === 1));
  assert.equal(kappaCurve('A'.repeat(300)).length, 20);
});

test('κテスト: 鍵 LEMON の暗号文（英文2,000字）は、ずらし幅が5の倍数で一致が多い', () => {
  const c = encryptVigenere(corpus.slice(0, 2000), 'LEMON');
  const curve = kappaCurve(c);
  const multiples = curve.filter((p) => p.k % 5 === 0).map((p) => p.rate);
  const others = curve.filter((p) => p.k % 5 !== 0).map((p) => p.rate);
  assert.ok(Math.min(...multiples) > Math.max(...others), `${multiples} ${others}`);
  assert.ok(Math.min(...multiples) > 0.055 && Math.max(...others) < 0.05);
});

test('列の中身: 周期で分けた列の文字・文字数・IC・出現回数', () => {
  const cols = columnDetails('ABCDEFG', 3);
  assert.deepEqual(cols.map((c) => [c.index, c.letters, c.n]), [[1, 'ADG', 3], [2, 'BE', 2], [3, 'CF', 2]]);
  assert.equal(cols[0].counts[0], 1);
  assert.equal(cols[0].counts.reduce((a, b) => a + b, 0), 3);
  const c = encryptVigenere(corpus.slice(0, 1000), 'LEMON');
  for (const col of columnDetails(c, 5)) assert.ok(col.ic > 0.055, `${col.index}: ${col.ic}`);
});

test('フリードマンの式: 代入した値と概算（英文300字を鍵 LEMON で暗号化すると13.20。平文なら約1）', () => {
  const c = encryptVigenere(corpus.slice(1000, 1300), 'LEMON');
  const f = friedmanEstimate(c);
  assert.equal(f.N, 300);
  assert.equal(f.kp, ENGLISH_KAPPA);
  assert.equal(f.kr, RANDOM_IC);
  assert.equal(f.ic, indexOfCoincidence(c));
  assert.ok(Math.abs(f.estimate - f.numerator / f.denominator) < 1e-12);
  assert.equal(f.estimate.toFixed(2), '13.20');
  const plain = friedmanEstimate(corpus.slice(0, 5000));
  assert.ok(Math.abs(plain.estimate - 1) < 0.2, String(plain.estimate));
  assert.equal(friedmanEstimate('ABCDEFGHIJKLMNOPQRSTUVWXYZ').estimate, Infinity);
});

test('乱数の種: 空欄は null（毎回ちがう）、0〜4294967295 の整数だけ。同じ種なら同じ並び', () => {
  assert.equal(parseSeed(''), null);
  assert.equal(parseSeed('  '), null);
  assert.equal(parseSeed(' 42 '), 42);
  assert.equal(parseSeed('4294967295'), 4294967295);
  for (const bad of ['-1', '4294967296', '1.5', 'abc', '12345678901']) assert.ok(Number.isNaN(parseSeed(bad)), bad);
  const a = makeRng(7);
  const b = makeRng(7);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
  assert.equal(makeRng(null), Math.random);
});

test('書き出し: CSV は BOM と CRLF、値はダブルクォートで囲む。JSON は整形して改行で終える。ファイル名に日時', () => {
  const csv = toCsv(['k', 'ic'], [[5, 0.0706], ['a"b', '']]);
  assert.ok(csv.startsWith(String.fromCharCode(0xfeff)));
  assert.equal(csv.slice(1), '"k","ic"\r\n"5","0.0706"\r\n"a""b",""\r\n');
  assert.equal(toJson({ a: 1 }), '{\n  "a": 1\n}\n');
  assert.equal(exportName('periodic', 'csv', new Date(2026, 9, 4, 1, 2)), 'ic-learning-visualizer_periodic_20261004-0102.csv');
});
