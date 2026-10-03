import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MESSAGES, t } from '../js/messages.js';
import { SAMPLE_ORDER, STEP3_PATTERNS, LANGUAGE_IC } from '../js/samples.js';

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const LOGIC = ['script.js', 'js/ic-core.js', 'js/samples.js', 'js/chart.js', 'js/tabs.js', 'js/theme.js', 'js/links.js', 'js/params.js', 'js/i18n.js'];
// かな・カタカナ・漢字（記号の定数はエスケープ表記で書くので、ここに当たるのは文言だけ）
const JAPANESE = new RegExp('[\\u3040-\\u30ff\\u3400-\\u9fff]');
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('画面の文言は messages.js に集め、ほかの JS のコード（コメント以外）に日本語を書かない', () => {
  for (const f of LOGIC) {
    const lines = stripComments(read(f)).split('\n');
    const hit = lines.findIndex((l) => JAPANESE.test(l));
    assert.equal(hit, -1, `${f}:${hit + 1} ${lines[hit]}`);
  }
});

test('script.js・theme.js が使うキーは、すべて日本語の辞書にある（テンプレートで組み立てるキーを含む）', () => {
  const keys = new Set();
  for (const f of ['script.js', 'js/theme.js']) for (const m of read(f).matchAll(/\bt\('([\w.]+)'/g)) keys.add(m[1]);
  STEP3_PATTERNS.forEach((_, i) => {
    keys.add(`step.patternTitle${i + 1}`);
    keys.add(`step.patternDesc${i + 1}`);
  });
  for (const k of ['random', 'english', 'vigenere']) {
    keys.add(`step.${k}`);
    keys.add(`step.${k}Desc`);
  }
  for (const n of [1, 2]) for (const r of ['correct', 'wrong']) keys.add(`quiz.${r}${n}`);
  for (const s of [...SAMPLE_ORDER, 'custom']) keys.add(`sample.${s}`);
  for (const b of ['tooShort', 'flat', 'middle', 'language', 'skewed']) {
    keys.add(`band.${b}`);
    keys.add(`band.${b}Desc`);
  }
  for (const l of LANGUAGE_IC) keys.add(`lang.${l.id}`);
  for (const k of keys) assert.ok(k in MESSAGES.ja, k);
  assert.ok(keys.size > 60, String(keys.size));
});

test('置き場所 {name} を値で埋める。未知のキーはキーのまま', () => {
  assert.equal(t('step.ic', { ic: '0.1000' }), 'IC = 0.1000');
  assert.equal(t('no.such.key'), 'no.such.key');
  assert.equal(t('monte.running', { done: 1 }), '実験中です（1 / {total} 回）');
});
