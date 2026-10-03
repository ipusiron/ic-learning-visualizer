import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KEY_IC_THRESHOLD } from '../js/ic-core.js';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const SCRIPTS = ['script.js', 'js/chart.js', 'js/tabs.js', 'js/theme.js', 'js/theme-init.js', 'js/file-check.js', 'js/links.js', 'js/params.js',
  'js/i18n.js', 'js/ciphers.js', 'js/export.js'];

test('CSP: インラインのスクリプト・スタイルを許さず、外部への送信先を持たない', () => {
  const m = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
  assert.ok(m);
  const csp = m[1];
  for (const d of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self'", "connect-src 'self'",
    "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    assert.ok(csp.includes(d), d);
  }
  assert.ok(!csp.includes('unsafe-inline'));
  assert.ok(!csp.includes('unsafe-eval'));
  assert.ok(!csp.includes('frame-ancestors'));
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
});

test('インラインのイベントハンドラー・style 属性・インラインのスクリプトがない（隠す要素は hidden 属性）', () => {
  assert.doesNotMatch(html, /\son[a-z]+="/i);
  assert.doesNotMatch(html, /\sstyle="/i);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    assert.match(m[1], /src="/);
    assert.equal(m[2].trim(), '');
  }
  for (const id of ['fileNotice', 'panel-analyze', 'panel-monte', 'panel-advanced', 'customTextSection', 'keyLengthResult', 'chartOther',
    'experimentResult', 'spreadResult', 'compareResult']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*hidden`), id);
  }
  // JS は CSSOM の width・height（棒の長さ・canvas の高さ）だけを使う。style 属性・cssText・innerHTML・alert は使わない
  for (const f of SCRIPTS) {
    const src = read(f);
    assert.doesNotMatch(src, /style="|\.cssText|setAttribute\('style'|innerHTML|insertAdjacentHTML|onclick|onchange|alert\(|confirm\(/, f);
    for (const m of src.matchAll(/\.style\.(\w+)/g)) assert.ok(['width', 'height'].includes(m[1]), `${f}: .style.${m[1]}`);
  }
});

test('読み込み順: テーマの初期化はスタイルより前、本体は module、file:// の案内は通常スクリプト。Worker は使わない', () => {
  const order = ['js/theme-init.js', 'style.css', 'script.js'].map((s) => html.indexOf(s));
  assert.ok(order.every((i) => i > 0));
  assert.ok(order[0] < order[1] && order[1] < order[2]);
  assert.match(html, /<script type="module" src="script.js"><\/script>/);
  assert.match(html, /<script src="js\/file-check.js" defer><\/script>/);
  assert.match(html, /<noscript>/);
  assert.match(read('script.js'), /setAttribute\('data-ready', 'true'\)/);
  for (const f of SCRIPTS) assert.doesNotMatch(read(f), /new Worker|postMessage/, f);
  assert.ok(!fs.existsSync(new URL('../worker.js', import.meta.url)));
});

test('画面の要素の id がそろっている（それぞれ1つだけ）', () => {
  const ids = ['fileNotice', 'btnTheme', 'tab-learn', 'tab-analyze', 'tab-monte', 'tab-advanced', 'panel-learn', 'panel-analyze', 'panel-monte',
    'panel-advanced', 'prevStep', 'nextStep', 'currentStep', 'totalSteps', 'simpleText', 'calcSimple', 'simpleStatus', 'freqTableBody', 'stepN',
    'stepDenom', 'denomCalc', 'stepNum', 'stepIC', 'icCalc', 'patternDemo', 'languageComparison', 'result1', 'result2', 'sampleNote', 'analyzeText',
    'analyzeAZ', 'analyzeSpaces', 'btnAnalyze', 'analyzeStatus', 'analysisChart', 'chartOther', 'metricN', 'metricIC', 'metricType', 'barRandom',
    'valueRandom', 'currentICBar', 'currentICValue', 'barEnglish', 'valueEnglish', 'typeInference', 'monteTextSource', 'monteTrials', 'monteSpeed',
    'customTextSection', 'monteCustomText', 'customTextInfo', 'textPreview', 'previewLength', 'previewIC', 'monteStart',
    'monteStop', 'monteReset', 'monteStatus', 'pickWindow1', 'pickWindow2', 'pos1', 'pos2', 'char1', 'char2', 'matchBadge', 'trialCount',
    'matchCount', 'experimentalIC', 'theoreticalIC', 'convergenceCanvas', 'monteProgressBar', 'monteProgress', 'languageTable',
    'vigenereText', 'estimateKeyLength', 'loadVigenereSample', 'keyLengthStatus', 'keyLengthResult', 'keyLengthTable', 'keyLengthVerdict',
    'keyLengthWhole', 'helpDialog', 'helpTitle', 'helpClose', 'monteReplacement', 'theoryLabel', 'experimentSource', 'experimentTrials',
    'runExperiment', 'experimentStatus', 'experimentResult', 'experimentCanvas', 'experimentSummary', 'experimentTable', 'periodicCanvas',
    'keyLengthLinks', 'btnLang', 'spreadLength', 'spreadTrials', 'spreadSeed', 'runSpread', 'spreadStatus', 'spreadResult', 'spreadCanvas',
    'spreadSummary', 'spreadTable', 'exportSpreadCsv', 'exportSpreadJson', 'monteSeed', 'exportMonteCsv', 'exportMonteJson', 'compareSource',
    'compareKeyLength', 'compareSeed', 'runCompare', 'compareStatus', 'compareResult', 'compareTable', 'exportCompareCsv', 'exportCompareJson',
    'experimentSeed', 'exportExperimentCsv', 'exportExperimentJson', 'exportPeriodicCsv', 'exportPeriodicJson', 'columnPeriod', 'columnSummary',
    'columnView', 'kappaShift', 'kappaRows', 'kappaInfo', 'kappaCanvas', 'friedmanFormula', 'friedmanVerdict', 'sumSqTable', 'keyLengthDemo',
    'periodDemo', 'tryKeyLength', 'result3', 'result4', 'result5', 'result6', 'result7', 'result8', 'quizScore', 'quizReset'];
  for (const id of ids) assert.equal(html.split(`id="${id}"`).length - 1, 1, id);
});

test('タブは role=tablist／tab／tabpanel の組で、aria-controls と aria-labelledby が対応する', () => {
  assert.match(html, /<nav class="tabs" role="tablist" aria-label="[^"]+"[^>]*>/);
  const re = /<button type="button" class="tab-button" role="tab" id="(tab-[\w-]+)" aria-controls="(panel-[\w-]+)" aria-selected="(true|false)"/g;
  const tabs = [...html.matchAll(re)];
  assert.equal(tabs.length, 4);
  assert.equal(tabs.filter((m) => m[3] === 'true').length, 1);
  for (const [, tab, panel] of tabs) {
    assert.match(html, new RegExp(`<section class="tab-content" id="${panel}" role="tabpanel" aria-labelledby="${tab}"`));
  }
});

test('ボタンには type、入力欄にはラベル、外部リンクには noopener noreferrer、状態の表示は aria-live、ヘルプは dialog', () => {
  for (const m of html.matchAll(/<button\b[^>]*>/g)) assert.match(m[0], /type="button"/, m[0]);
  for (const m of html.matchAll(/<(input|textarea|select)\b[^>]*id="([^"]+)"/g)) {
    if (/type="(checkbox|radio)"/.test(m[0])) continue;
    assert.match(html, new RegExp(`<label for="${m[2]}"[ >]`), m[2]);
  }
  for (const m of html.matchAll(/<input type="(checkbox|radio)"[^>]*>/g)) assert.ok(html.includes(`<label>${m[0]}`), m[0]);
  for (const m of html.matchAll(/<a\b[^>]*href="https?:[^"]*"[^>]*>/g)) assert.match(m[0], /rel="noopener noreferrer"/, m[0]);
  for (const id of ['simpleStatus', 'analyzeStatus', 'monteStatus', 'keyLengthStatus', 'experimentStatus', 'typeInference', 'result1', 'result2',
    'spreadStatus', 'compareStatus', 'columnSummary', 'kappaInfo', 'quizScore']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-live="polite"`), id);
  }
  assert.match(html, /<dialog id="helpDialog" class="modal" aria-labelledby="helpTitle">/);
  for (const m of html.matchAll(/class="help-icon" data-help="([\w-]+)" aria-label="[^"]+"/g)) {
    assert.match(html, new RegExp(`data-help-topic="${m[1]}"`), m[1]);
  }
  assert.match(html, /role="progressbar"[^>]*aria-valuemin="0" aria-valuemax="100"/);
  // JS が作るリンク（ほかのツールへ）も新しいタブで、参照元を渡さない
  assert.match(read('script.js'), /target: '_blank', rel: 'noopener noreferrer'/);
});

test('画面のしきい値の説明はロジックの値と同じ', () => {
  assert.ok(html.includes(`平均が${KEY_IC_THRESHOLD}以上の周期`));
});
