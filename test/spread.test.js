import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { lengthSpread, xorshift32, RANDOM_IC } from '../js/ic-core.js';

const raw = fs.readFileSync(new URL('../corpus/eval-pg98.txt', import.meta.url));
const corpus = raw.toString('utf8').replace(/[^A-Z]/g, '');

test('同梱の英文は出典の文書どおり（英字20万字、SHA-256 が NOTICE と一致）', () => {
  assert.equal(corpus.length, 200000);
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  const notice = fs.readFileSync(new URL('../corpus/NOTICE.md', import.meta.url), 'utf8');
  assert.equal(notice.split(sha).length - 1, 2);
});

test('文字数とばらつき: 短いほど幅が広い（英文20字は5〜95%で0.04〜0.09、1,000字は0.062〜0.070に収まる）', () => {
  const s20 = lengthSpread(corpus, 20, 2000, xorshift32(1));
  const s100 = lengthSpread(corpus, 100, 2000, xorshift32(2));
  const s1000 = lengthSpread(corpus, 1000, 2000, xorshift32(3));
  assert.ok(s20.p5 < 0.045 && s20.p95 > 0.085, `${s20.p5} ${s20.p95}`);
  assert.ok(s1000.p5 > 0.06 && s1000.p95 < 0.072, `${s1000.p5} ${s1000.p95}`);
  assert.ok(s20.p95 - s20.p5 > s100.p95 - s100.p5 && s100.p95 - s100.p5 > s1000.p95 - s1000.p5);
  assert.ok(s20.p5 <= s20.p50 && s20.p50 <= s20.p95);
  assert.equal(s20.values.length, 2000);
  for (let i = 1; i < s20.values.length; i++) assert.ok(s20.values[i - 1] <= s20.values[i]);
});

test('文字数とばらつき: 区分の割合（20字は判定しない、100字は「言語らしい」が8〜9割、1,000字はほぼすべて）', () => {
  const s20 = lengthSpread(corpus, 20, 1000, xorshift32(4));
  assert.equal(s20.shares.tooShort, 1);
  const s100 = lengthSpread(corpus, 100, 2000, xorshift32(5));
  assert.ok(s100.shares.language > 0.8 && s100.shares.language < 0.95, String(s100.shares.language));
  const s1000 = lengthSpread(corpus, 1000, 1000, xorshift32(6));
  assert.ok(s1000.shares.language > 0.99);
  const total = Object.values(s100.shares).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.equal(lengthSpread('ABC', 10, 5, xorshift32(1)), null);
  assert.ok(RANDOM_IC < s1000.p5);
});
