import test from 'node:test';
import assert from 'node:assert/strict';
import { approxPolyIC, keyLengthExperiment, sigmaBand, standardError, normalizeText, indexOfCoincidence, xorshift32, RANDOM_IC } from '../js/ic-core.js';
import { ENGLISH } from '../js/samples.js';

const near = (a, b, eps = 1e-12) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('近似式: 鍵長1は平文の IC、鍵長が長いほど 1/26 に近づき、単調に下がる', () => {
  near(approxPolyIC(0.0667, 1), 0.0667);
  near(approxPolyIC(0.0667, 2), (0.0667 + RANDOM_IC) / 2);
  let prev = Infinity;
  for (let L = 1; L <= 20; L++) {
    const v = approxPolyIC(0.0667, L);
    assert.ok(v < prev && v > RANDOM_IC);
    prev = v;
  }
  assert.ok(Math.abs(approxPolyIC(0.0667, 1000) - RANDOM_IC) < 0.0001);
});

test('鍵長とICの実験: 英文（1,900字）を鍵長1〜20で40個ずつの鍵で暗号化した平均は、近似式と0.004以内', () => {
  const plain = normalizeText(ENGLISH.repeat(4)).text;
  const lengths = Array.from({ length: 20 }, (_, i) => i + 1);
  const r = keyLengthExperiment(plain, lengths, xorshift32(47), 40);
  near(r.kp, indexOfCoincidence(plain));
  assert.equal(r.rows.length, 20);
  near(r.rows[0].measured, r.kp);
  for (const row of r.rows) assert.ok(Math.abs(row.measured - row.approx) < 0.004, `L=${row.L}: ${row.measured} ${row.approx}`);
  assert.ok(r.rows[19].measured < r.rows[1].measured);
});

test('ばらつきの帯は p ± 2×標準誤差で、0〜1に収める', () => {
  const [lo, hi] = sigmaBand(0.0651, 1000);
  near(hi - 0.0651, 2 * standardError(0.0651, 1000));
  near(0.0651 - lo, 2 * standardError(0.0651, 1000));
  assert.deepEqual(sigmaBand(0.01, 10), [0, 0.01 + 2 * standardError(0.01, 10)]);
  assert.deepEqual(sigmaBand(0.5, 0), [0.5, 0.5]);
});
