import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { substitution, columnar, autokey, autokeyDecrypt, randomKey, compareCiphers, COMPARE_IDS } from '../js/ciphers.js';
import { indexOfCoincidence, xorshift32, encryptVigenere, approxPolyIC } from '../js/ic-core.js';

const corpus = fs.readFileSync(new URL('../corpus/eval-pg98.txt', import.meta.url), 'utf8').replace(/[^A-Z]/g, '');
const plain = corpus.slice(0, 2000);

test('自動鍵暗号の既知解答（Wikipedia: ATTACKATDAWN を鍵 QUEENLY で QNXEPVYTWTWP）と往復', () => {
  assert.equal(autokey('ATTACKATDAWN', 'QUEENLY').text, 'QNXEPVYTWTWP');
  assert.equal(autokeyDecrypt('QNXEPVYTWTWP', 'QUEENLY'), 'ATTACKATDAWN');
  const k = randomKey(5, xorshift32(3));
  assert.equal(autokeyDecrypt(autokey(plain, k).text, k), plain);
});

test('単一換字と列転置は、文字の出現回数の組み合わせを変えないので IC が平文とまったく同じ', () => {
  const rng = xorshift32(11);
  const s = substitution(plain, rng);
  assert.equal(new Set(s.key).size, 26);
  assert.equal(indexOfCoincidence(s.text), indexOfCoincidence(plain));
  const c = columnar(plain, 7, rng);
  assert.deepEqual([...c.order].sort(), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(c.text.length, plain.length);
  assert.equal(indexOfCoincidence(c.text), indexOfCoincidence(plain));
  assert.notEqual(c.text, plain);
});

test('比べる5方式: 平文・単一換字・列転置は IC が同じ、ヴィジュネルは近似式に近く周期ICで鍵長5、自動鍵は1/26に近く周期が出ない', () => {
  const rows = compareCiphers(plain, xorshift32(20261004), { vigenereLength: 5 });
  assert.deepEqual(rows.map((r) => r.id), COMPARE_IDS);
  const ic = Object.fromEntries(rows.map((r) => [r.id, r.ic]));
  assert.equal(ic.substitution, ic.plain);
  assert.equal(ic.columnar, ic.plain);
  assert.ok(Math.abs(ic.vigenere - approxPolyIC(ic.plain, 5)) < 0.004, String(ic.vigenere));
  assert.equal(rows.find((r) => r.id === 'vigenere').period, 5);
  assert.ok(ic.autokey < 0.045, String(ic.autokey));
  assert.equal(rows.find((r) => r.id === 'autokey').period, null);
  // 同じ種なら同じ結果（授業で画面をそろえられる）
  assert.deepEqual(compareCiphers(plain, xorshift32(20261004)).map((r) => r.text), rows.map((r) => r.text));
  assert.equal(rows.find((r) => r.id === 'vigenere').text.length, encryptVigenere(plain, 'AAAAA').length);
});
