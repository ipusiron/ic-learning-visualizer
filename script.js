// IC Learning Visualizer の画面の処理（ES module）。計算は js/ic-core.js、文言は js/messages.js
// 画面に入れる文字列はすべて textContent で入れる（HTML として解釈しない）

import {
  MAX_TEXT, RANDOM_IC, KEY_IC_THRESHOLD, MIN_VERDICT, normalizeText, letterCounts, icDetail, breakdownRows, keyLengthCandidates,
  classifyIC, runTrials, historyStep, formatIC, standardError, expectedRate, keyLengthExperiment, ALPHABET, kappa, kappaCurve, columnDetails,
  friedmanEstimate, lengthSpread, parseSeed, makeRng, sigmaBand, BANDS, ENGLISH_KAPPA, periodicIC, approxPolyIC
} from './js/ic-core.js';
import { compareCiphers } from './js/ciphers.js';
import { toCsv, toJson, exportName } from './js/export.js';
import {
  SAMPLES, VIGENERE_KEY, VIGENERE_PLAIN, ENGLISH, STEP3_PATTERNS, QUIZ1_OPTIONS, QUIZ_ANSWERS, SUMSQ_WORDS, LANGUAGE_IC
} from './js/samples.js';
import { t, setLanguage, getLanguage } from './js/messages.js';
import { initialLanguage, saveLanguage, applyStaticText, useLanguage } from './js/i18n.js';
import { initTabs } from './js/tabs.js';
import { initThemeToggle, refreshThemeButton } from './js/theme.js';
import { drawConvergence, drawPeriodic, drawExperiment, drawHistogram } from './js/chart.js';
import { buildToolLinks } from './js/links.js';
import { readParams, urlWithoutText } from './js/params.js';

const $ = (sel) => document.querySelector(sel);
const fmt = (n) => n.toLocaleString('en-US');
const TOTAL_STEPS = 8;
const STEP6_LENGTHS = [1, 2, 3, 5, 10, 20];
const STEP7_MAX_PERIOD = 12;
const SIMPLE_MAX = 30;
const KEY_MIN_LETTERS = 20;
const KEY_ROWS = 10;
const EXPERIMENT_LENGTHS = Array.from({ length: 20 }, (_, i) => i + 1);
const EXPERIMENT_MIN_LETTERS = 20;
const ENGLISH_IC = LANGUAGE_IC.find((l) => l.id === 'english').dcode;
const MONTE_MIN = 100;
const MONTE_MAX = 100000;
// 速さ: 1回の処理で進める試行の数と、次の処理までの間（ミリ秒）
const SPEED = { slow: { per: 1, delay: 400 }, normal: { per: 25, delay: 40 }, fast: { per: 20000, delay: 0 } };

const state = {
  step: 1,
  analysis: { text: '', N: 0, ic: 0, ignored: 0 },
  monte: { running: false, timer: null, chars: [], total: 0, done: 0, matches: 0, history: [], theory: 0, last: null, step: 1, replacement: false },
  key: null,
  experiment: null,
  spread: null,
  compare: null,
  corpus: null,
  periodicAt: null,
  kappaAt: null,
  quiz: {}
};
const CORPUS_URL = 'corpus/eval-pg98.txt';
const SPREAD_MIN = 100;
const SPREAD_MAX = 5000;
const KAPPA_VIEW = 60;
const COLUMN_PREVIEW = 24;

// 乱数の種の欄を読む。空欄なら null（毎回ちがう乱数）。正しくなければ状態の欄に知らせて undefined
function readSeed(input, status) {
  const seed = parseSeed(input.value);
  if (Number.isNaN(seed)) {
    say(status, 'seed.bad', {}, true);
    return undefined;
  }
  return seed;
}

// 完了の文: 種があれば種を添え、なければ「毎回ちがう」用の文にする（言語を切り替えても描き直せるように、キーで分ける）
function sayDone(status, key, vars, seed) {
  if (seed === null) say(status, `${key}Random`, vars);
  else say(status, key, { ...vars, seed });
}

// 書き出し: Blob を作ってリンクを押す（ページの外へは送らない）
function download(text, kind, ext, status) {
  const file = exportName(kind, ext, new Date());
  const url = URL.createObjectURL(new Blob([text], { type: ext === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' }));
  const a = el('a', { href: url, download: file });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say(status, 'export.done', { file });
}

function bindExport(prefix, kind, status, build) {
  for (const ext of ['csv', 'json']) {
    $(`#${prefix}${ext === 'csv' ? 'Csv' : 'Json'}`).addEventListener('click', () => {
      const data = build();
      if (!data) return say(status, 'export.nothing', {}, true);
      download(ext === 'csv' ? toCsv(data.header, data.rows) : toJson(data.json), kind, ext, status);
    });
  }
}

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'text') node.textContent = v;
    else if (k === 'className') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

// 状態の表示。キーと値を覚えておき、言語を切り替えたら描き直す（key が空なら消す）
const said = new Map();

function say(node, key = '', vars = {}, error = false) {
  if (key) said.set(node, { key, vars });
  else said.delete(node);
  node.textContent = key ? t(key, vars) : '';
  node.classList.toggle('error', error);
}

function resay() {
  for (const [node, s] of said) node.textContent = t(s.key, s.vars);
}

// 棒の長さ（CSSOM で幅を入れる。style 属性は使わない）
function setBar(node, value, max) {
  node.style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

// ===== ステップ学習 =====
function showStep(n) {
  state.step = n;
  for (const s of document.querySelectorAll('.step')) s.hidden = Number(s.dataset.step) !== n;
  $('#currentStep').textContent = String(n);
  $('#totalSteps').textContent = String(TOTAL_STEPS);
  $('#prevStep').disabled = n === 1;
  $('#nextStep').disabled = n === TOTAL_STEPS;
}

function calculateSimple() {
  const status = $('#simpleStatus');
  const raw = $('#simpleText').value;
  const { text, ignored } = normalizeText(raw);
  if (text.length > SIMPLE_MAX) return say(status, 'step.tooLong', {}, true);
  if (text.length < 2) return say(status, 'step.minChars', {}, true);
  const d = icDetail(text);
  const rows = breakdownRows(text).map((r) => el('tr', {}, [el('td', { text: r.ch }), el('td', { text: String(r.n) }), el('td', { text: String(r.pairs) })]));
  $('#freqTableBody').replaceChildren(...rows);
  $('#stepN').textContent = String(d.N);
  $('#stepDenom').textContent = String(d.denom);
  $('#denomCalc').textContent = `= ${d.N} × ${d.N - 1}`;
  $('#stepNum').textContent = String(d.pairs);
  $('#stepIC').textContent = formatIC(d.ic);
  $('#icCalc').textContent = `= ${d.pairs} ÷ ${d.denom}`;
  say(status, ignored ? 'step.ignored' : '', { n: ignored });
}

function miniBars(text) {
  const { counts } = letterCounts(text);
  const max = Math.max(...counts);
  const bars = [];
  counts.forEach((n, i) => {
    if (!n) return;
    const bar = el('span', { className: 'mini-bar', title: `${ALPHABET[i]}: ${n}` });
    bar.style.height = `${(n / max) * 100}%`;
    bars.push(bar);
  });
  return el('div', { className: 'mini-bar-chart', 'aria-hidden': 'true' }, bars);
}

function renderPatterns() {
  const cards = STEP3_PATTERNS.map((p, i) => el('div', { className: 'pattern-item' }, [
    el('h4', { text: t(`step.patternTitle${i + 1}`) }),
    el('div', { className: 'mini-text', text: p }),
    miniBars(p),
    el('div', { className: 'ic-value', text: t('step.ic', { ic: formatIC(icDetail(p).ic) }) }),
    el('p', { className: 'desc', text: t(`step.patternDesc${i + 1}`) })
  ]));
  $('#patternDemo').replaceChildren(...cards);
}

function renderLanguageComparison() {
  const vig = icDetail(normalizeText(SAMPLES.vigenere).text).ic;
  const items = [
    { key: 'random', value: RANDOM_IC, cls: 'random' },
    { key: 'english', value: ENGLISH_IC, cls: 'english' },
    { key: 'vigenere', value: vig, cls: 'cipher' }
  ].map((it) => {
    const bar = el('span', { className: `ic-bar ${it.cls}` });
    setBar(bar, it.value, 0.08);
    return el('div', { className: 'lang-item' }, [
      el('h4', { text: t(`step.${it.key}`) }),
      el('span', { className: 'ic-track', 'aria-hidden': 'true' }, [bar]),
      el('span', { className: 'ic-label', text: `IC ≈ ${formatIC(it.value)}` }),
      el('p', { className: 'desc', text: t(`step.${it.key}Desc`) })
    ]);
  });
  $('#languageComparison').replaceChildren(...items);
}

// ステップ5: 同じ位置も選ぶ確率（Σp²）と IC を並べる
function renderSumSq() {
  const english = normalizeText(SAMPLES.english).text;
  const rows = [...SUMSQ_WORDS.map((w) => ({ label: w, text: w })), { label: t('step.sumSqEnglish'), text: english }].map((r) => el('tr', {}, [
    el('th', { scope: 'row', text: r.label }),
    el('td', { text: fmt(r.text.length) }),
    el('td', { text: formatIC(expectedRate(r.text, true)) }),
    el('td', { text: formatIC(expectedRate(r.text)) })
  ]));
  $('#sumSqTable tbody').replaceChildren(...rows);
}

// 名前・棒・値の1行（ステップ6・7）
function icRow(label, value, cls) {
  const bar = el('span', { className: `ic-bar ${cls}` });
  setBar(bar, value, 0.08);
  return el('div', { className: 'ic-row' }, [
    el('span', { className: 'ic-row-name', text: label }),
    el('span', { className: 'ic-track', 'aria-hidden': 'true' }, [bar]),
    el('span', { className: 'ic-row-value', text: formatIC(value) })
  ]);
}

// ステップ6: 鍵長ごとの近似式の値（棒）と、でたらめな文字列の 1/26
function renderKeyLengthDemo() {
  const rows = STEP6_LENGTHS.map((L) => icRow(t('step.keyLength', { L }), approxPolyIC(ENGLISH_IC, L), L === 1 ? 'english' : 'cipher'));
  rows.push(icRow(t('step.keyLengthRandom'), RANDOM_IC, 'random'));
  $('#keyLengthDemo').replaceChildren(...rows);
}

// ステップ7: ヴィジュネル暗号のサンプルを周期1〜12で分けたときの列の IC の平均
function renderPeriodDemo() {
  const curve = periodicIC(normalizeText(SAMPLES.vigenere).text, STEP7_MAX_PERIOD);
  const rows = curve.map((p) => icRow(t('step.period', { k: p.k }), p.ic, p.ic >= KEY_IC_THRESHOLD ? 'english' : 'cipher'));
  $('#periodDemo').replaceChildren(...rows);
}

// クイズ: 答え合わせした問題ごとに、正解かどうかを覚えて正答数を出す
function renderScore() {
  const total = Object.keys(QUIZ_ANSWERS).length;
  const done = Object.keys(state.quiz).length;
  const ok = Object.values(state.quiz).filter(Boolean).length;
  if (!done) return say($('#quizScore'));
  say($('#quizScore'), ok === total ? 'quiz.scoreAll' : 'quiz.score', { ok, done, total });
}

function checkQuiz(n) {
  const out = $(`#result${n}`);
  const chosen = document.querySelector(`input[name="q${n}"]:checked`);
  out.classList.remove('correct', 'incorrect');
  if (!chosen) return say(out, 'quiz.choose');
  const ok = chosen.value === QUIZ_ANSWERS[n];
  state.quiz[n] = ok;
  out.classList.add(ok ? 'correct' : 'incorrect');
  const c = formatIC(icDetail(QUIZ1_OPTIONS.c).ic);
  say(out, `quiz.${ok ? 'correct' : 'wrong'}${n}`, { c });
  renderScore();
}

function resetQuiz() {
  for (const input of document.querySelectorAll('.quiz-options input')) input.checked = false;
  for (const out of document.querySelectorAll('.quiz-result')) {
    out.classList.remove('correct', 'incorrect');
    say(out);
  }
  state.quiz = {};
  renderScore();
}

function initSteps() {
  $('#prevStep').addEventListener('click', () => showStep(Math.max(1, state.step - 1)));
  $('#nextStep').addEventListener('click', () => showStep(Math.min(TOTAL_STEPS, state.step + 1)));
  $('#calcSimple').addEventListener('click', calculateSimple);
  $('#simpleText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) calculateSimple();
  });
  for (const b of document.querySelectorAll('.btn-check')) b.addEventListener('click', () => checkQuiz(b.dataset.quiz));
  $('#quizReset').addEventListener('click', resetQuiz);
  renderPatterns();
  renderLanguageComparison();
  renderSumSq();
  renderKeyLengthDemo();
  renderPeriodDemo();
  calculateSimple();
  showStep(1);
}

// ===== サンプル分析 =====
function analysisOptions() {
  return { lettersOnly: $('#analyzeAZ').checked, removeSpaces: $('#analyzeSpaces').checked };
}

function selectSample(name) {
  for (const b of document.querySelectorAll('.sample-btn')) b.setAttribute('aria-pressed', String(b.dataset.sample === name));
  say($('#sampleNote'), `sample.${name}`, { key: VIGENERE_KEY });
  if (name === 'custom') {
    $('#analyzeText').value = '';
    $('#analyzeText').focus();
    return;
  }
  $('#analyzeText').value = SAMPLES[name];
  analyze();
}

function renderChart(text) {
  const { counts, other } = letterCounts(text);
  const max = Math.max(1, ...counts);
  const bars = counts.map((n, i) => {
    const bar = el('span', { className: 'freq-bar' });
    bar.style.height = `${(n / max) * 100}%`;
    const letter = el('span', { className: 'freq-letter', text: ALPHABET[i] });
    return el('span', { className: 'freq-col', title: t('analyze.barTitle', { ch: ALPHABET[i], n }) }, [bar, letter]);
  });
  $('#analysisChart').replaceChildren(...bars);
  const note = $('#chartOther');
  note.hidden = other === 0;
  note.textContent = other ? t('analyze.other', { n: fmt(other) }) : '';
}

function renderAnalysis() {
  const a = state.analysis;
  if (!a.N) return;
  $('#metricN').textContent = fmt(a.N);
  $('#metricIC').textContent = formatIC(a.ic);
  $('#currentICValue').textContent = formatIC(a.ic);
  setBar($('#currentICBar'), a.ic, 0.1);
  renderChart(a.text);
  renderBand(a.ic, a.N);
}

function renderBand(ic, N) {
  const { band, short } = classifyIC(ic, N);
  $('#metricType').textContent = t(`band.${band}`);
  const lines = [el('p', { className: 'band-name', text: t(`band.${band}`) }),
    el('p', { text: t(`band.${band}Desc`, { n: fmt(N), min: MIN_VERDICT }) })];
  if (short && band !== 'tooShort') lines.push(el('p', { className: 'note', text: t('band.shortNote', { n: fmt(N) }) }));
  $('#typeInference').replaceChildren(...lines);
}

function analyze() {
  const status = $('#analyzeStatus');
  const raw = $('#analyzeText').value;
  if (!raw.trim()) return say(status, 'analyze.empty', {}, true);
  if (raw.length > MAX_TEXT) return say(status, 'analyze.tooLong', { n: fmt(raw.length), max: fmt(MAX_TEXT) }, true);
  const { text, ignored } = normalizeText(raw, analysisOptions());
  const d = icDetail(text);
  if (d.N < 2) return say(status, 'analyze.tooFew', {}, true);
  state.analysis = { text, N: d.N, ic: d.ic, ignored };
  renderAnalysis();
  say(status, 'analyze.done', { n: fmt(d.N), ignored: fmt(ignored) });
  // モンテカルロの対象が「サンプル分析タブのテキスト」なら、前の実験の結果を残さない（実験中は対象を変えられない）
  if ($('#monteTextSource').value === 'current' && !state.monte.running) resetMonte();
}

function initAnalysis() {
  for (const b of document.querySelectorAll('.sample-btn')) b.addEventListener('click', () => selectSample(b.dataset.sample));
  $('#btnAnalyze').addEventListener('click', analyze);
  $('#analyzeAZ').addEventListener('change', () => {
    $('#analyzeSpaces').disabled = $('#analyzeAZ').checked;
  });
  setBar($('#barRandom'), RANDOM_IC, 0.1);
  setBar($('#barEnglish'), ENGLISH_IC, 0.1);
  $('#valueRandom').textContent = formatIC(RANDOM_IC);
  $('#valueEnglish').textContent = formatIC(ENGLISH_IC);
  selectSample('english');
  $('#runSpread').addEventListener('click', runSpread);
  bindExport('exportSpread', 'spread', $('#spreadStatus'), () => {
    const x = state.spread;
    if (!x) return null;
    const { r } = x;
    return {
      header: ['n', 'ic'], rows: r.values.map((v) => [r.N, v.toFixed(6)]),
      json: { n: r.N, windows: r.trials, seed: x.seed, p5: r.p5, p50: r.p50, p95: r.p95, shares: r.shares, values: r.values }
    };
  });
}

// ===== モンテカルロ実験 =====
function monteText() {
  const source = $('#monteTextSource').value;
  if (source === 'current') return state.analysis.text;
  if (source === 'custom') return normalizeText($('#monteCustomText').value).text;
  return normalizeText(SAMPLES[source] || '').text;
}

function updatePreview() {
  const text = monteText();
  const chars = [...text];
  const PREVIEW = 300;
  const shown = chars.slice(0, PREVIEW).join('');
  $('#textPreview').textContent = shown ? shown + (chars.length > PREVIEW ? t('monte.previewMore', { n: fmt(chars.length - PREVIEW) }) : '')
    : t('monte.previewEmpty');
  $('#previewLength').textContent = fmt(chars.length);
  $('#previewIC').textContent = formatIC(icDetail(text).ic);
}

function renderCustomInfo() {
  const raw = $('#monteCustomText').value;
  $('#customTextInfo').textContent = t('monte.customInfo', { raw: fmt([...raw].length), letters: fmt(normalizeText(raw).text.length) });
}

function updateCustomInfo() {
  renderCustomInfo();
  resetMonte();
}

function renderPickWindow(node, chars, pos) {
  const R = 10;
  const from = Math.max(0, pos - R);
  const to = Math.min(chars.length, pos + R + 1);
  const parts = [];
  if (from > 0) parts.push(el('span', { className: 'pick-ellipsis', text: '…' }));
  for (let i = from; i < to; i++) parts.push(el('span', { className: i === pos ? 'pick-char picked' : 'pick-char', text: chars[i] }));
  if (to < chars.length) parts.push(el('span', { className: 'pick-ellipsis', text: '…' }));
  node.replaceChildren(...parts);
}

function drawMonteChart() {
  const m = state.monte;
  drawConvergence($('#convergenceCanvas'), {
    history: m.history, theory: m.theory, total: m.total, band: true,
    labels: { x: t('monte.axisX'), y: t('monte.axisY'), theory: t('monte.theory', { ic: formatIC(m.theory) }) }
  });
}

function renderMonte() {
  const m = state.monte;
  const rate = m.done ? m.matches / m.done : 0;
  $('#trialCount').textContent = fmt(m.done);
  $('#matchCount').textContent = fmt(m.matches);
  $('#experimentalIC').textContent = formatIC(rate);
  $('#theoreticalIC').textContent = formatIC(m.theory);
  $('#theoryLabel').textContent = t(m.replacement ? 'monte.theorySq' : 'monte.theoryIC');
  const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
  $('#monteProgress').style.width = `${pct}%`;
  $('#monteProgressBar').setAttribute('aria-valuenow', String(pct));
  if (m.last) {
    renderPickWindow($('#pickWindow1'), m.chars, m.last.pos1);
    renderPickWindow($('#pickWindow2'), m.chars, m.last.pos2);
    $('#pos1').textContent = t('monte.position', { n: fmt(m.last.pos1 + 1) });
    $('#pos2').textContent = t('monte.position', { n: fmt(m.last.pos2 + 1) });
    $('#char1').textContent = m.last.char1;
    $('#char2').textContent = m.last.char2;
    const badge = $('#matchBadge');
    badge.textContent = t(m.last.match ? 'monte.yes' : 'monte.no');
    badge.className = `match-badge ${m.last.match ? 'yes' : 'no'}`;
  }
  drawMonteChart();
}

// 実験中は対象・回数を変えられないようにする（結果と対象が食い違わないように）
function lockMonte(running) {
  $('#monteStart').disabled = running;
  $('#monteStop').disabled = !running;
  for (const id of ['#monteTextSource', '#monteTrials', '#monteCustomText', '#monteReplacement', '#monteSeed']) $(id).disabled = running;
}

function finishMonte(stopped) {
  const m = state.monte;
  m.running = false;
  clearTimeout(m.timer);
  lockMonte(false);
  if (stopped) return say($('#monteStatus'), 'monte.stopped', { done: fmt(m.done) });
  const rate = m.done ? m.matches / m.done : 0;
  say($('#monteStatus'), 'monte.done', {
    total: fmt(m.done), exp: formatIC(rate), ic: formatIC(m.theory), diff: formatIC(Math.abs(rate - m.theory)),
    se2: formatIC(2 * standardError(m.theory, m.done))
  });
}

function tick() {
  const m = state.monte;
  if (!m.running) return;
  const speed = SPEED[$('#monteSpeed').value] || SPEED.normal;
  const target = Math.min(m.total, m.done + speed.per);
  // 記録の間隔ごとに区切って進め、どの速さでも収束の線が描けるようにする
  while (m.done < target) {
    const next = Math.min(target, (Math.floor(m.done / m.step) + 1) * m.step);
    const r = runTrials(m.chars, next - m.done, m.rng, m.replacement);
    m.done = next;
    m.matches += r.matches;
    m.last = r.last;
    if (m.done % m.step === 0 || m.done === m.total) m.history.push({ trial: m.done, rate: m.matches / m.done });
  }
  renderMonte();
  if (m.done >= m.total) return finishMonte(false);
  say($('#monteStatus'), 'monte.running', { done: fmt(m.done), total: fmt(m.total) });
  m.timer = setTimeout(tick, speed.delay);
}

function startMonte() {
  const status = $('#monteStatus');
  const source = $('#monteTextSource').value;
  if (source === 'custom' && !$('#monteCustomText').value.trim()) return say(status, 'monte.needCustom', {}, true);
  const text = monteText();
  const chars = [...text];
  if (chars.length < 2) return say(status, 'monte.tooShort', {}, true);
  const input = $('#monteTrials');
  const total = Number(input.value);
  if (!Number.isInteger(total) || total < MONTE_MIN || total > MONTE_MAX || (input.validity && input.validity.badInput)) {
    return say(status, 'monte.badTrials', { min: fmt(MONTE_MIN), max: fmt(MONTE_MAX) }, true);
  }
  const seed = readSeed($('#monteSeed'), status);
  if (seed === undefined) return;
  const replacement = $('#monteReplacement').checked;
  Object.assign(state.monte, {
    running: true, chars, total, done: 0, matches: 0, history: [], theory: expectedRate(text, replacement), last: null,
    step: historyStep(total), replacement, rng: makeRng(seed), seed
  });
  lockMonte(true);
  renderMonte();
  tick();
}

function resetMonte() {
  const m = state.monte;
  clearTimeout(m.timer);
  const replacement = $('#monteReplacement').checked;
  Object.assign(m, { running: false, done: 0, matches: 0, history: [], last: null, total: 0, theory: expectedRate(monteText(), replacement), replacement });
  lockMonte(false);
  updatePreview();
  for (const id of ['#pos1', '#pos2', '#char1', '#char2', '#matchBadge']) $(id).textContent = '-';
  $('#matchBadge').className = 'match-badge';
  $('#pickWindow1').replaceChildren();
  $('#pickWindow2').replaceChildren();
  say($('#monteStatus'));
  renderMonte();
}

function initMonte() {
  $('#monteStart').addEventListener('click', startMonte);
  $('#monteStop').addEventListener('click', () => finishMonte(true));
  $('#monteReset').addEventListener('click', resetMonte);
  $('#monteTextSource').addEventListener('change', () => {
    $('#customTextSection').hidden = $('#monteTextSource').value !== 'custom';
    resetMonte();
  });
  $('#monteCustomText').addEventListener('input', updateCustomInfo);
  $('#monteReplacement').addEventListener('change', resetMonte);
  bindExport('exportMonte', 'montecarlo', $('#monteStatus'), () => {
    const m = state.monte;
    if (!m.history.length) return null;
    const rows = m.history.map((h) => {
      const [lo, hi] = sigmaBand(m.theory, h.trial);
      return [h.trial, h.rate.toFixed(6), lo.toFixed(6), hi.toFixed(6)];
    });
    return {
      header: ['trial', 'rate', 'band_low', 'band_high'], rows,
      json: { letters: m.chars.length, theory: m.theory, replacement: m.replacement, seed: m.seed, trials: m.done, matches: m.matches, history: m.history }
    };
  });
}

// ===== 応用・暗号解析 =====
function renderLanguageTable() {
  const rows = LANGUAGE_IC.map((l) => el('tr', {}, [
    el('th', { scope: 'row', text: t(`lang.${l.id}`) }),
    el('td', { text: `${l.friedman.toFixed(2)} → ${formatIC(l.friedman / 26)}` }),
    el('td', { text: l.dcode === null ? t('lang.none') : formatIC(l.dcode) })
  ]));
  $('#languageTable tbody').replaceChildren(...rows);
}

function estimateKeyLength() {
  const status = $('#keyLengthStatus');
  const raw = $('#vigenereText').value;
  const box = $('#keyLengthResult');
  box.hidden = true;
  if (!raw.trim()) return say(status, 'key.empty', {}, true);
  if (raw.length > MAX_TEXT) return say(status, 'key.tooLong', { n: fmt(raw.length), max: fmt(MAX_TEXT) }, true);
  const text = normalizeText(raw).text;
  if (text.length < KEY_MIN_LETTERS) return say(status, 'key.tooShort', { n: text.length, min: KEY_MIN_LETTERS }, true);
  const r = keyLengthCandidates(text);
  const first = r.periodFound ? r.candidates[0] : 1;
  state.key = { text, r, curve: [{ k: 1, ic: r.whole }, ...r.curve], kappa: kappaCurve(text), column: first, shift: first };
  box.hidden = false;
  renderKeyResult();
  say(status);
}

function renderKeyResult() {
  if (!state.key) return;
  const { text, r } = state.key;
  const icOf = Object.fromEntries(r.curve.map((p) => [p.k, p.ic]));
  const rows = r.candidates.slice(0, KEY_ROWS).map((k, i) => el('tr', { className: icOf[k] >= KEY_IC_THRESHOLD ? 'hit' : '' }, [
    el('td', { text: String(i + 1) }), el('td', { text: String(k) }), el('td', { text: formatIC(icOf[k]) }),
    el('td', { text: icOf[k] >= KEY_IC_THRESHOLD ? t('key.hit') : t('key.miss') })
  ]));
  $('#keyLengthTable tbody').replaceChildren(...rows);
  const hits = r.candidates.filter((k) => icOf[k] >= KEY_IC_THRESHOLD).slice(0, 3);
  const maxK = Math.max(...r.curve.map((p) => p.k));
  $('#keyLengthVerdict').textContent = r.periodFound
    ? t('key.found', { list: hits.join(t('key.listJoin')), th: KEY_IC_THRESHOLD })
    : t('key.notFound', { th: KEY_IC_THRESHOLD, max: maxK });
  $('#keyLengthWhole').textContent = t(r.whole >= KEY_IC_THRESHOLD ? 'key.wholeHigh' : 'key.whole', { ic: formatIC(r.whole) });
  renderToolLinks(text, r.periodFound ? r.candidates[0] : null);
  fillSelect($('#columnPeriod'), state.key.curve.map((p) => p.k), state.key.column);
  fillSelect($('#kappaShift'), state.key.kappa.map((p) => p.k), state.key.shift);
  renderColumns();
  renderKappa();
  renderFriedman();
  drawKeyChart();
}

function fillSelect(select, values, selected) {
  select.replaceChildren(...values.map((v) => {
    const o = el('option', { value: String(v), text: String(v) });
    if (v === selected) o.selected = true;
    return o;
  }));
}

function drawKeyChart() {
  if (!state.key || $('#keyLengthResult').hidden) return;
  state.periodicAt = drawPeriodic($('#periodicCanvas'), {
    curve: state.key.curve, threshold: KEY_IC_THRESHOLD, selected: state.key.column,
    labels: { x: t('key.chartX'), y: t('key.chartY'), threshold: t('key.chartThreshold', { th: KEY_IC_THRESHOLD }) }
  });
  drawKappaChart();
}

// 列の中身: 選んだ周期で分けた列ごとに、文字数・IC・出現回数の棒・先頭の文字
function renderColumns() {
  if (!state.key) return;
  const L = state.key.column;
  const cols = columnDetails(state.key.text, L);
  const avg = cols.reduce((sum, c) => sum + c.ic, 0) / cols.length;
  $('#columnSummary').textContent = t('columns.summary', { L, avg: formatIC(avg), th: KEY_IC_THRESHOLD });
  const cards = cols.map((c) => {
    const max = Math.max(1, ...c.counts);
    const bars = c.counts.map((n, i) => {
      const bar = el('span', { className: 'freq-bar' });
      bar.style.height = `${(n / max) * 100}%`;
      return el('span', { className: 'freq-col', title: t('analyze.barTitle', { ch: ALPHABET[i], n }) }, [bar]);
    });
    const preview = c.letters.slice(0, COLUMN_PREVIEW) + (c.letters.length > COLUMN_PREVIEW ? '…' : '');
    return el('div', { className: c.ic >= KEY_IC_THRESHOLD ? 'column-card hit' : 'column-card' }, [
      el('p', { className: 'column-title', text: t('columns.card', { i: c.index, n: c.n, ic: formatIC(c.ic) }) }),
      el('div', { className: 'column-bars', 'aria-hidden': 'true' }, bars),
      el('p', { className: 'column-letters', text: preview })
    ]);
  });
  $('#columnView').replaceChildren(...cards);
}

// κテスト: 暗号文とk文字ずらした暗号文を2行に並べ、同じ文字が重なる位置を光らせる（先頭の60字ぶん）
function renderKappa() {
  if (!state.key) return;
  const chars = [...state.key.text];
  const k = state.key.shift;
  const top = [];
  const bottom = [];
  for (let i = 0; i + k < chars.length && i < KAPPA_VIEW; i++) {
    const hit = chars[i] === chars[i + k];
    top.push(el('span', { className: hit ? 'kappa-char hit' : 'kappa-char', text: chars[i] }));
    bottom.push(el('span', { className: hit ? 'kappa-char hit' : 'kappa-char', text: chars[i + k] }));
  }
  const pad = Array.from({ length: k }, () => el('span', { className: 'kappa-char pad', text: '·' }));
  $('#kappaRows').replaceChildren(
    el('div', { className: 'kappa-row' }, [...pad, ...top]),
    el('div', { className: 'kappa-row' }, bottom)
  );
  const r = kappa(state.key.text, k);
  $('#kappaInfo').textContent = t('kappa.info', { k, overlap: fmt(r.overlap), matches: fmt(r.matches), rate: formatIC(r.rate) });
}

function drawKappaChart() {
  if (!state.key || $('#keyLengthResult').hidden) return;
  state.kappaAt = drawPeriodic($('#kappaCanvas'), {
    curve: state.key.kappa.map((p) => ({ k: p.k, ic: p.rate })), threshold: KEY_IC_THRESHOLD, selected: state.key.shift, wholeFirst: false,
    lines: [{ value: ENGLISH_KAPPA, label: t('kappa.english', { v: formatIC(ENGLISH_KAPPA) }) }, { value: RANDOM_IC, label: t('kappa.random') }],
    labels: { x: t('kappa.chartX'), y: t('kappa.chartY'), threshold: '' }
  });
}

// フリードマンの式: 代入した値と、周期ごとのICの候補との比較
function renderFriedman() {
  if (!state.key) return;
  const f = friedmanEstimate(state.key.text);
  const est = Number.isFinite(f.estimate) ? f.estimate.toFixed(1) : '∞';
  $('#friedmanFormula').textContent = Number.isFinite(f.estimate) ? t('friedman.formula', {
    kp: f.kp.toFixed(4), kr: f.kr.toFixed(4), n: f.N, ic: formatIC(f.ic), num: f.numerator.toFixed(2), den: f.denominator.toFixed(2), est
  }) : t('friedman.infinite');
  const r = state.key.r;
  $('#friedmanVerdict').textContent = Number.isFinite(f.estimate)
    ? t(r.periodFound ? 'friedman.compare' : 'friedman.compareNone', { est, k: r.candidates[0] }) : '';
}

function selectColumn(k) {
  if (!state.key || !k) return;
  state.key.column = k;
  $('#columnPeriod').value = String(k);
  renderColumns();
  drawKeyChart();
}

function selectShift(k) {
  if (!state.key || !k) return;
  state.key.shift = k;
  $('#kappaShift').value = String(k);
  renderKappa();
  drawKappaChart();
}

// 暗号文を渡してほかのツールで続けるリンク。渡せないとき（長すぎる・鍵長がない）は、ページだけを開き、理由を添える
function renderToolLinks(letters, period) {
  const items = buildToolLinks(letters, period).map((l) => {
    const a = el('a', { href: l.href, target: '_blank', rel: 'noopener noreferrer', text: t(l.key) });
    const note = l.passed ? t(l.id === 'divider' || l.id === 'alphaloom' ? 'link.passedPeriod' : 'link.passed', { n: period })
      : t(`link.${l.reason}`, { max: fmt(l.max) });
    return el('li', {}, [a, el('span', { className: 'link-note', text: note })]);
  });
  $('#keyLengthLinks').replaceChildren(...items);
}

// ===== 鍵長とICの実験 =====
function experimentPlain() {
  const source = $('#experimentSource').value;
  if (source === 'english') return normalizeText(ENGLISH).text;
  if (source === 'current') return normalizeText(state.analysis.text).text;
  return normalizeText(VIGENERE_PLAIN).text;
}

function drawExperimentChart() {
  if (!state.experiment || $('#experimentResult').hidden) return;
  drawExperiment($('#experimentCanvas'), {
    rows: state.experiment.r.rows,
    labels: { x: t('exp.axisX'), y: t('exp.axisY'), measured: t('exp.legendMeasured'), approx: t('exp.legendApprox'), random: t('exp.legendRandom') }
  });
}

function runExperiment() {
  const status = $('#experimentStatus');
  const plain = experimentPlain();
  if (plain.length < EXPERIMENT_MIN_LETTERS) return say(status, 'exp.tooShort', { n: plain.length, min: EXPERIMENT_MIN_LETTERS }, true);
  const input = $('#experimentTrials');
  const trials = Number(input.value);
  if (!Number.isInteger(trials) || trials < 1 || trials > 50) return say(status, 'exp.badTrials', {}, true);
  const seed = readSeed($('#experimentSeed'), status);
  if (seed === undefined) return;
  state.experiment = { r: keyLengthExperiment(plain, EXPERIMENT_LENGTHS, makeRng(seed), trials), n: plain.length, trials, seed };
  $('#experimentResult').hidden = false;
  renderExperiment();
  sayDone(status, 'exp.done', { trials }, seed);
}

// ===== 暗号の種類とICの比較 =====
function comparePlain() {
  const source = $('#compareSource').value;
  if (source === 'english') return normalizeText(ENGLISH).text;
  if (source === 'current') return normalizeText(state.analysis.text).text;
  return normalizeText(VIGENERE_PLAIN).text;
}

function runCompare() {
  const status = $('#compareStatus');
  const plain = comparePlain();
  if (plain.length < EXPERIMENT_MIN_LETTERS) return say(status, 'exp.tooShort', { n: plain.length, min: EXPERIMENT_MIN_LETTERS }, true);
  const L = Number($('#compareKeyLength').value);
  if (!Number.isInteger(L) || L < 1 || L > 20) return say(status, 'compare.badLength', {}, true);
  const seed = readSeed($('#compareSeed'), status);
  if (seed === undefined) return;
  state.compare = { rows: compareCiphers(plain, makeRng(seed), { vigenereLength: L }), n: plain.length, L, seed };
  $('#compareResult').hidden = false;
  renderCompare();
  sayDone(status, 'compare.done', { n: fmt(plain.length) }, seed);
}

function renderCompare() {
  if (!state.compare) return;
  const { rows, n, L } = state.compare;
  $('#compareTable tbody').replaceChildren(...rows.map((r) => el('tr', {}, [
    el('th', { scope: 'row', text: t(`compare.${r.id}`, { L }) }),
    el('td', { text: formatIC(r.ic) }),
    el('td', { text: t(`band.${classifyIC(r.ic, n).band}`) }),
    el('td', { text: r.period === null ? t('compare.none') : r.period === 1 ? t('compare.single') : String(r.period) }),
    el('td', {}, [el('code', { text: r.text.slice(0, 40) })])
  ])));
}

// ===== 文字数とICのばらつき =====
async function loadCorpus() {
  if (state.corpus) return state.corpus;
  const res = await fetch(CORPUS_URL);
  if (!res.ok) throw new Error(String(res.status));
  state.corpus = (await res.text()).replace(/[^A-Z]/g, '');
  return state.corpus;
}

async function runSpread() {
  const status = $('#spreadStatus');
  const N = Number($('#spreadLength').value);
  const trials = Number($('#spreadTrials').value);
  if (!Number.isInteger(trials) || trials < SPREAD_MIN || trials > SPREAD_MAX) return say(status, 'spread.badTrials', {}, true);
  const seed = readSeed($('#spreadSeed'), status);
  if (seed === undefined) return;
  $('#runSpread').disabled = true;
  try {
    say(status, 'spread.loading');
    const corpus = await loadCorpus();
    state.spread = { r: lengthSpread(corpus, N, trials, makeRng(seed)), seed };
    $('#spreadResult').hidden = false;
    renderSpread();
    sayDone(status, 'spread.done', { trials: fmt(trials) }, seed);
  } catch (e) {
    say(status, 'spread.loadFailed', {}, true);
  } finally {
    $('#runSpread').disabled = false;
  }
}

const SPREAD_BANDS = ['tooShort', 'flat', 'middle', 'language', 'skewed'];

function renderSpread() {
  if (!state.spread) return;
  const { r } = state.spread;
  $('#spreadSummary').textContent = t('spread.summary', { n: r.N, p5: formatIC(r.p5), p95: formatIC(r.p95), p50: formatIC(r.p50) });
  $('#spreadTable tbody').replaceChildren(...SPREAD_BANDS.filter((b) => r.shares[b] > 0).map((b) => el('tr', {}, [
    el('th', { scope: 'row', text: t(`band.${b}`) }), el('td', { text: `${(r.shares[b] * 100).toFixed(1)}%` })
  ])));
  drawSpreadChart();
}

function drawSpreadChart() {
  if (!state.spread || $('#spreadResult').hidden) return;
  drawHistogram($('#spreadCanvas'), {
    values: state.spread.r.values,
    marks: [
      { value: RANDOM_IC, label: t('spread.markRandom') },
      { value: BANDS.middle, label: t('spread.markMiddle', { v: BANDS.middle }) },
      { value: BANDS.language, label: t('spread.markLanguage', { v: BANDS.language }) }
    ],
    labels: { x: t('spread.axisX'), y: t('spread.axisY') }
  });
}

function renderExperiment() {
  if (!state.experiment) return;
  const { r, n } = state.experiment;
  const row = (L) => r.rows.find((x) => x.L === L);
  $('#experimentSummary').textContent = t('exp.summary', {
    n: fmt(n), kp: formatIC(r.kp), m5: formatIC(row(5).measured), a5: formatIC(row(5).approx), m20: formatIC(row(20).measured)
  });
  const rows = r.rows.map((x) => el('tr', {}, [
    el('td', { text: String(x.L) }), el('td', { text: formatIC(x.measured) }), el('td', { text: formatIC(x.approx) })
  ]));
  $('#experimentTable tbody').replaceChildren(...rows);
  drawExperimentChart();
}

function loadVigenereSample() {
  $('#vigenereText').value = SAMPLES.vigenere;
  estimateKeyLength();
}

function initAdvanced() {
  renderLanguageTable();
  $('#estimateKeyLength').addEventListener('click', estimateKeyLength);
  $('#loadVigenereSample').addEventListener('click', loadVigenereSample);
  $('#runExperiment').addEventListener('click', runExperiment);
  $('#runCompare').addEventListener('click', runCompare);
  $('#columnPeriod').addEventListener('change', () => selectColumn(Number($('#columnPeriod').value)));
  $('#kappaShift').addEventListener('change', () => selectShift(Number($('#kappaShift').value)));
  // 棒グラフの棒を押して周期（ずらす文字数）を選ぶ
  $('#periodicCanvas').addEventListener('click', (e) => selectColumn(state.periodicAt && state.periodicAt(e.offsetX)));
  $('#kappaCanvas').addEventListener('click', (e) => selectShift(state.kappaAt && state.kappaAt(e.offsetX)));
  bindExport('exportPeriodic', 'periodic', $('#keyLengthStatus'), () => {
    if (!state.key) return null;
    const rows = state.key.curve.map((p) => [p.k, p.ic.toFixed(6), p.k > 1 && p.ic >= KEY_IC_THRESHOLD ? 1 : 0]);
    const kp = state.key.kappa.map((p) => ({ k: p.k, rate: p.rate, matches: p.matches, overlap: p.overlap }));
    return {
      header: ['period', 'average_column_ic', 'at_or_above_threshold'], rows,
      json: { letters: state.key.text.length, threshold: KEY_IC_THRESHOLD, candidates: state.key.r.candidates, periodic: state.key.curve, kappa: kp,
        friedman: friedmanEstimate(state.key.text) }
    };
  });
  bindExport('exportExperiment', 'experiment', $('#experimentStatus'), () => {
    const x = state.experiment;
    if (!x) return null;
    return {
      header: ['key_length', 'measured_mean_ic', 'approximation'], rows: x.r.rows.map((r) => [r.L, r.measured.toFixed(6), r.approx.toFixed(6)]),
      json: { letters: x.n, plaintext_ic: x.r.kp, keys_per_length: x.trials, seed: x.seed, rows: x.r.rows }
    };
  });
  bindExport('exportCompare', 'compare', $('#compareStatus'), () => {
    const c = state.compare;
    if (!c) return null;
    return {
      header: ['method', 'ic', 'period_candidate', 'ciphertext'], rows: c.rows.map((r) => [r.id, r.ic.toFixed(6), r.period ?? '', r.text]),
      json: { letters: c.n, vigenere_key_length: c.L, seed: c.seed, rows: c.rows }
    };
  });
}

// URL の #text=（または ?text=）を、サンプル分析と鍵長推定の両方に入れて実行する。tab で開くタブを選ぶ
function applyParams(tabs) {
  const { text, tab } = readParams(window.location.search, window.location.hash);
  // 読み込んだら URL から text を消す（replaceState なので「戻る」の回数は増えない）
  const cleaned = urlWithoutText(window.location.href);
  if (cleaned !== null) {
    try {
      history.replaceState(history.state, '', cleaned);
    } catch {
      // 消せない環境でも、読み込みはそのまま続ける
    }
  }
  if (text) {
    for (const b of document.querySelectorAll('.sample-btn')) b.setAttribute('aria-pressed', String(b.dataset.sample === 'custom'));
    say($('#sampleNote'), 'sample.url');
    $('#analyzeText').value = text;
    analyze();
    $('#vigenereText').value = text;
    estimateKeyLength();
  }
  if (tab || text) tabs.select(tab || 'analyze');
}

function redrawCharts() {
  if (!$('#panel-monte').hidden) drawMonteChart();
  if (!$('#panel-analyze').hidden) drawSpreadChart();
  if (!$('#panel-advanced').hidden) {
    drawKeyChart();
    drawExperimentChart();
  }
}

// ===== ヘルプ（dialog） =====
function initHelp() {
  const dialog = $('#helpDialog');
  let opener = null;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.help-icon');
    if (!btn) return;
    const topic = btn.dataset.help;
    for (const s of dialog.querySelectorAll('.help-topic')) s.hidden = s.dataset.helpTopic !== topic;
    $('#helpTitle').textContent = btn.getAttribute('aria-label');
    opener = btn;
    dialog.showModal();
    $('#helpClose').focus();
  });
  $('#helpClose').addEventListener('click', () => dialog.close());
  // 背景（dialog の外側）を押したら閉じる
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (opener) opener.focus();
  });
}

// ===== 言語の切り替え =====
// 静的な文言は data-i18n で、JS が組み立てた文言は状態から描き直す（入力と結果はそのまま残す）
function rerenderAll() {
  refreshThemeButton($('#btnTheme'));
  renderPatterns();
  renderLanguageComparison();
  renderSumSq();
  renderKeyLengthDemo();
  renderPeriodDemo();
  renderLanguageTable();
  renderAnalysis();
  renderCustomInfo();
  updatePreview();
  renderMonte();
  renderKeyResult();
  renderExperiment();
  renderCompare();
  renderSpread();
  resay();
}

function switchLanguage() {
  const next = getLanguage() === 'ja' ? 'en' : 'ja';
  useLanguage(next);
  saveLanguage(next);
  rerenderAll();
}

// ===== 初期化 =====
function init() {
  setLanguage(initialLanguage());
  applyStaticText();
  $('#btnLang').addEventListener('click', switchLanguage);
  initThemeToggle($('#btnTheme'));
  initSteps();
  initAnalysis();
  initMonte();
  renderCustomInfo();
  initAdvanced();
  initHelp();
  const tabs = initTabs($('.tabs'), redrawCharts);
  // ステップ7から、応用タブでサンプルの鍵長を推定する（入力欄へ移る）
  $('#tryKeyLength').addEventListener('click', () => {
    tabs.select('advanced');
    loadVigenereSample();
    $('#vigenereText').focus();
  });
  // テーマが変わったら、canvas の色を描き直す
  new MutationObserver(redrawCharts).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawCharts);
  window.addEventListener('resize', redrawCharts);
  resetMonte();
  applyParams(tabs);
  document.documentElement.setAttribute('data-ready', 'true');
}

init();
