import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// style.css の色の変数（ライトと、ダークの上書き）を読み、WCAG のコントラスト比を計算する
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');

function vars(selector) {
  const i = css.indexOf(selector);
  assert.ok(i >= 0, selector);
  const body = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}

const light = vars(':root {');
const dark = { ...light, ...vars(':root[data-theme="dark"] {') };
const media = { ...light, ...vars(':root:not([data-theme="light"]) {') };

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// 文字（4.5:1）
const BACKS = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-accent', 'surface'];
const TEXT = [
  ...['text-primary', 'text-secondary', 'text-muted', 'accent-text'].flatMap((fg) => BACKS.map((bg) => [fg, bg])),
  ['success-text', 'surface'], ['success-text', 'bg-primary'], ['error-text', 'bg-primary'], ['error-text', 'bg-tertiary'],
  ['on-primary', 'primary'], ['on-primary', 'primary-dark'], ['on-primary', 'success'], ['on-primary', 'danger'],
  ['correct-text', 'correct-bg'], ['incorrect-text', 'incorrect-bg'], ['picked-text', 'picked-bg'],
  ['text-primary', 'highlight-bg'], ['text-primary', 'insight-bg'], ['chart-text', 'surface'], ['chart-theory', 'surface']
];
// 入力欄の枠線・棒・グラフの線（非テキスト、3:1）
const UI = [['input-border', 'surface'], ['input-border', 'bg-tertiary'], ['chart-line', 'surface'], ['chart-axis', 'surface'],
  ['bar-current', 'bg-tertiary'], ['bar-english', 'bg-tertiary'], ['bar-random', 'bg-tertiary'], ['bar-cipher', 'bg-tertiary']];

test('計算の確かめ: 白と黒は21:1、同じ色は1:1', () => {
  assert.equal(Math.round(ratio('#ffffff', '#000000')), 21);
  assert.equal(ratio('#2563eb', '#2563eb'), 1);
});

for (const [name, pal] of [['ライト', light], ['ダーク', dark], ['OS のダーク設定', media]]) {
  test(`${name}: 文字は4.5:1以上、枠線・棒・グラフの線は3:1以上`, () => {
    for (const [fg, bg] of TEXT) assert.ok(ratio(pal[fg], pal[bg]) >= 4.5, `${fg} on ${bg}: ${ratio(pal[fg], pal[bg]).toFixed(2)}`);
    for (const [fg, bg] of UI) assert.ok(ratio(pal[fg], pal[bg]) >= 3, `${fg} on ${bg}: ${ratio(pal[fg], pal[bg]).toFixed(2)}`);
  });
}

test('ヘッダーの白い文字は、グラデーションの両端で4.5:1以上（ライト・ダーク）', () => {
  for (const pal of [light, dark]) for (const k of ['header-from', 'header-to']) assert.ok(ratio('#ffffff', pal[k]) >= 4.5, `${k}: ${pal[k]}`);
});

test('ダークの上書きは、明示の切り替えと OS の設定とで同じ値', () => {
  assert.deepEqual(vars(':root[data-theme="dark"] {'), vars(':root:not([data-theme="light"]) {'));
});

test('入力欄の文字は16px（1rem）、操作の高さは44px以上、ヘルプの「?」は押せる範囲が44px', () => {
  const rule = (sel) => {
    const i = css.indexOf(sel);
    assert.ok(i >= 0, sel);
    return css.slice(i, css.indexOf('}', i));
  };
  for (const sel of ['.input-section textarea {', '.key-length-estimator textarea {', '.interactive-calc input {', '.setup-item select,']) {
    assert.match(rule(sel), /font-size: 1rem;/, sel);
  }
  assert.match(rule('.custom-text-section textarea {'), /font-size: 1rem;/);
  for (const sel of ['.icon-btn {', '.btn-primary,\n.btn-secondary,\n.btn-danger,\n.btn-check,\n.btn-nav,\n.sample-btn {', '.quiz-options label {']) {
    assert.match(rule(sel), /(min-)?height: 44px;/, sel);
  }
  assert.match(rule('.help-icon {'), /width: 28px;/);
  assert.match(rule('.help-icon::after {'), /inset: -8px;/);
  assert.match(rule('.modal-close {'), /width: 44px;[\s\S]*height: 44px;/);
});

test('アニメーションは、視差効果を減らす設定のときに止める', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important;/);
});
