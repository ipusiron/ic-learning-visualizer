import test from 'node:test';
import assert from 'node:assert/strict';
import { buildToolLinks, TOOLS, BASE } from '../js/links.js';
import { readParams, urlWithoutText, MAX_PARAM_TEXT } from '../js/params.js';

test('鍵長があれば、Day030・Day046 には ?text=…&n=…、Day017・Day009 には ?text= で渡す', () => {
  const links = buildToolLinks('LXFOPVEFRNHR', 5);
  assert.deepEqual(links.map((l) => l.href), [
    `${BASE}modular-text-divider/?text=LXFOPVEFRNHR&n=5`,
    `${BASE}alphaloom/?text=LXFOPVEFRNHR&n=5`,
    `${BASE}vigenere-cipher-tool/?text=LXFOPVEFRNHR`,
    `${BASE}frequency-analyzer/?text=LXFOPVEFRNHR`
  ]);
  assert.ok(links.every((l) => l.passed));
});

test('鍵長がない・長すぎるときは、文字列を付けずにツールのページを開く', () => {
  const noPeriod = buildToolLinks('ABCDEF', null);
  assert.deepEqual(noPeriod.map((l) => [l.id, l.passed, l.reason]), [
    ['divider', false, 'noPeriod'], ['alphaloom', false, 'noPeriod'], ['vigenere', true, null], ['frequency', true, null]
  ]);
  const long = buildToolLinks('A'.repeat(6000), 3);
  assert.deepEqual(long.map((l) => l.passed), [true, true, true, false]);
  assert.equal(long[3].href, `${BASE}frequency-analyzer/`);
  assert.equal(long[3].reason, 'tooLong');
  assert.deepEqual(buildToolLinks('A'.repeat(10001), 21).map((l) => l.passed), [false, false, true, false]);
  assert.equal(TOOLS.length, 4);
});

test('URL の ?text= は10,000字まで、?tab= は4つのタブの名前だけ', () => {
  assert.deepEqual(readParams('?text=HELLO&tab=advanced'), { text: 'HELLO', tab: 'advanced' });
  assert.deepEqual(readParams('?text=%20%20&tab=other'), { text: null, tab: null });
  assert.deepEqual(readParams(''), { text: null, tab: null });
  assert.equal(readParams(`?text=${'A'.repeat(MAX_PARAM_TEXT + 5)}`).text.length, MAX_PARAM_TEXT);
  assert.equal(readParams('?text=a%26b%3Dc').text, 'a&b=c');
});

test('読み込んだ ?text= は URL から消す（tab・lang・# は残す。text がなければ何もしない）', () => {
  const base = 'https://ipusiron.github.io/ic-learning-visualizer/';
  assert.equal(urlWithoutText(`${base}?text=ABC&tab=advanced`), '/ic-learning-visualizer/?tab=advanced');
  assert.equal(urlWithoutText(`${base}?lang=en&text=ABC&tab=analyze#x`), '/ic-learning-visualizer/?lang=en&tab=analyze#x');
  assert.equal(urlWithoutText(`${base}?text=ABC`), '/ic-learning-visualizer/');
  assert.equal(urlWithoutText(`${base}?text=`), '/ic-learning-visualizer/');
  assert.equal(urlWithoutText(`${base}?tab=advanced`), null);
  assert.equal(urlWithoutText(base), null);
});
