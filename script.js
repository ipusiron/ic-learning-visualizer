// IC Learning Visualizer の画面の処理（ES module）。計算は js/ic-core.js、文言は js/messages.js
// 画面に入れる文字列はすべて textContent で入れる（HTML として解釈しない）

import {
  MAX_TEXT, RANDOM_IC, KEY_IC_THRESHOLD, MIN_VERDICT, normalizeText, letterCounts, icDetail, breakdownRows, keyLengthCandidates,
  classifyIC, runTrials, historyStep, formatIC, standardError, expectedRate, keyLengthExperiment, ALPHABET
} from './js/ic-core.js';
import { SAMPLES, VIGENERE_KEY, VIGENERE_PLAIN, ENGLISH, STEP3_PATTERNS, QUIZ1_OPTIONS, LANGUAGE_IC } from './js/samples.js';
import { t } from './js/messages.js';
import { initTabs } from './js/tabs.js';
import { initThemeToggle } from './js/theme.js';
import { drawConvergence, drawPeriodic, drawExperiment } from './js/chart.js';
import { buildToolLinks } from './js/links.js';
import { readParams } from './js/params.js';

const $ = (sel) => document.querySelector(sel);
const fmt = (n) => n.toLocaleString('en-US');
const TOTAL_STEPS = 5;
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
  analysis: { text: '' },
  monte: { running: false, timer: null, chars: [], total: 0, done: 0, matches: 0, history: [], theory: 0, last: null, step: 1, replacement: false },
  key: null,
  experiment: null
};

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

function setStatus(node, text, error = false) {
  node.textContent = text;
  node.classList.toggle('error', error);
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
  if (text.length > SIMPLE_MAX) return setStatus(status, t('step.tooLong'), true);
  if (text.length < 2) return setStatus(status, t('step.minChars'), true);
  const d = icDetail(text);
  const rows = breakdownRows(text).map((r) => el('tr', {}, [el('td', { text: r.ch }), el('td', { text: String(r.n) }), el('td', { text: String(r.pairs) })]));
  $('#freqTableBody').replaceChildren(...rows);
  $('#stepN').textContent = String(d.N);
  $('#stepDenom').textContent = String(d.denom);
  $('#denomCalc').textContent = `= ${d.N} × ${d.N - 1}`;
  $('#stepNum').textContent = String(d.pairs);
  $('#stepIC').textContent = formatIC(d.ic);
  $('#icCalc').textContent = `= ${d.pairs} ÷ ${d.denom}`;
  setStatus(status, ignored ? t('step.ignored', { n: ignored }) : '');
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

function checkQuiz(n) {
  const out = $(`#result${n}`);
  const chosen = document.querySelector(`input[name="q${n}"]:checked`);
  out.classList.remove('correct', 'incorrect');
  if (!chosen) {
    out.textContent = t('quiz.choose');
    return;
  }
  const ok = chosen.value === 'b';
  out.classList.add(ok ? 'correct' : 'incorrect');
  const c = formatIC(icDetail(QUIZ1_OPTIONS.c).ic);
  out.textContent = t(`quiz.${ok ? 'correct' : 'wrong'}${n}`, { c });
}

function initSteps() {
  $('#prevStep').addEventListener('click', () => showStep(Math.max(1, state.step - 1)));
  $('#nextStep').addEventListener('click', () => showStep(Math.min(TOTAL_STEPS, state.step + 1)));
  $('#calcSimple').addEventListener('click', calculateSimple);
  $('#simpleText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) calculateSimple();
  });
  for (const b of document.querySelectorAll('.btn-check')) b.addEventListener('click', () => checkQuiz(b.dataset.quiz));
  renderPatterns();
  renderLanguageComparison();
  calculateSimple();
  showStep(1);
}

// ===== サンプル分析 =====
function analysisOptions() {
  return { lettersOnly: $('#analyzeAZ').checked, removeSpaces: $('#analyzeSpaces').checked };
}

function selectSample(name) {
  for (const b of document.querySelectorAll('.sample-btn')) b.setAttribute('aria-pressed', String(b.dataset.sample === name));
  $('#sampleNote').textContent = t(`sample.${name}`, { key: VIGENERE_KEY });
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
  if (!raw.trim()) return setStatus(status, t('analyze.empty'), true);
  if (raw.length > MAX_TEXT) return setStatus(status, t('analyze.tooLong', { n: fmt(raw.length), max: fmt(MAX_TEXT) }), true);
  const { text, ignored } = normalizeText(raw, analysisOptions());
  const d = icDetail(text);
  if (d.N < 2) return setStatus(status, t('analyze.tooFew'), true);
  state.analysis.text = text;
  $('#metricN').textContent = fmt(d.N);
  $('#metricIC').textContent = formatIC(d.ic);
  $('#currentICValue').textContent = formatIC(d.ic);
  setBar($('#currentICBar'), d.ic, 0.1);
  renderChart(text);
  renderBand(d.ic, d.N);
  setStatus(status, t('analyze.done', { n: fmt(d.N), ignored: fmt(ignored) }));
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

function updateCustomInfo() {
  const raw = $('#monteCustomText').value;
  $('#customTextLength').textContent = fmt([...raw].length);
  $('#customTextProcessed').textContent = fmt(normalizeText(raw).text.length);
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
  for (const id of ['#monteTextSource', '#monteTrials', '#monteCustomText', '#monteReplacement']) $(id).disabled = running;
}

function finishMonte(stopped) {
  const m = state.monte;
  m.running = false;
  clearTimeout(m.timer);
  lockMonte(false);
  if (stopped) return setStatus($('#monteStatus'), t('monte.stopped', { done: fmt(m.done) }));
  const rate = m.done ? m.matches / m.done : 0;
  setStatus($('#monteStatus'), t('monte.done', {
    total: fmt(m.done), exp: formatIC(rate), ic: formatIC(m.theory), diff: formatIC(Math.abs(rate - m.theory)),
    se2: formatIC(2 * standardError(m.theory, m.done))
  }));
}

function tick() {
  const m = state.monte;
  if (!m.running) return;
  const speed = SPEED[$('#monteSpeed').value] || SPEED.normal;
  const target = Math.min(m.total, m.done + speed.per);
  // 記録の間隔ごとに区切って進め、どの速さでも収束の線が描けるようにする
  while (m.done < target) {
    const next = Math.min(target, (Math.floor(m.done / m.step) + 1) * m.step);
    const r = runTrials(m.chars, next - m.done, Math.random, m.replacement);
    m.done = next;
    m.matches += r.matches;
    m.last = r.last;
    if (m.done % m.step === 0 || m.done === m.total) m.history.push({ trial: m.done, rate: m.matches / m.done });
  }
  renderMonte();
  if (m.done >= m.total) return finishMonte(false);
  setStatus($('#monteStatus'), t('monte.running', { done: fmt(m.done), total: fmt(m.total) }));
  m.timer = setTimeout(tick, speed.delay);
}

function startMonte() {
  const status = $('#monteStatus');
  const source = $('#monteTextSource').value;
  if (source === 'custom' && !$('#monteCustomText').value.trim()) return setStatus(status, t('monte.needCustom'), true);
  const text = monteText();
  const chars = [...text];
  if (chars.length < 2) return setStatus(status, t('monte.tooShort'), true);
  const input = $('#monteTrials');
  const total = Number(input.value);
  if (!Number.isInteger(total) || total < MONTE_MIN || total > MONTE_MAX || (input.validity && input.validity.badInput)) {
    return setStatus(status, t('monte.badTrials', { min: fmt(MONTE_MIN), max: fmt(MONTE_MAX) }), true);
  }
  const replacement = $('#monteReplacement').checked;
  Object.assign(state.monte, {
    running: true, chars, total, done: 0, matches: 0, history: [], theory: expectedRate(text, replacement), last: null,
    step: historyStep(total), replacement
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
  setStatus($('#monteStatus'), '');
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
  if (!raw.trim()) return setStatus(status, t('key.empty'), true);
  if (raw.length > MAX_TEXT) return setStatus(status, t('key.tooLong', { n: fmt(raw.length), max: fmt(MAX_TEXT) }), true);
  const text = normalizeText(raw).text;
  if (text.length < KEY_MIN_LETTERS) return setStatus(status, t('key.tooShort', { n: text.length, min: KEY_MIN_LETTERS }), true);
  const r = keyLengthCandidates(text);
  const icOf = Object.fromEntries(r.curve.map((p) => [p.k, p.ic]));
  const rows = r.candidates.slice(0, KEY_ROWS).map((k, i) => el('tr', { className: icOf[k] >= KEY_IC_THRESHOLD ? 'hit' : '' }, [
    el('td', { text: String(i + 1) }), el('td', { text: String(k) }), el('td', { text: formatIC(icOf[k]) }),
    el('td', { text: icOf[k] >= KEY_IC_THRESHOLD ? t('key.hit') : t('key.miss') })
  ]));
  $('#keyLengthTable tbody').replaceChildren(...rows);
  const hits = r.candidates.filter((k) => icOf[k] >= KEY_IC_THRESHOLD).slice(0, 3);
  $('#keyLengthVerdict').textContent = r.periodFound
    ? t('key.found', { list: hits.join(t('key.listJoin')), th: KEY_IC_THRESHOLD }) : t('key.notFound', { th: KEY_IC_THRESHOLD });
  $('#keyLengthWhole').textContent = t(r.whole >= KEY_IC_THRESHOLD ? 'key.wholeHigh' : 'key.whole', { ic: formatIC(r.whole) });
  state.key = { curve: [{ k: 1, ic: r.whole }, ...r.curve] };
  renderToolLinks(text, r.periodFound ? r.candidates[0] : null);
  box.hidden = false;
  drawKeyChart();
  setStatus(status, '');
}

function drawKeyChart() {
  if (!state.key || $('#keyLengthResult').hidden) return;
  drawPeriodic($('#periodicCanvas'), {
    curve: state.key.curve, threshold: KEY_IC_THRESHOLD,
    labels: { x: t('key.chartX'), y: t('key.chartY'), threshold: t('key.chartThreshold', { th: KEY_IC_THRESHOLD }) }
  });
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
    rows: state.experiment.rows,
    labels: { x: t('exp.axisX'), y: t('exp.axisY'), measured: t('exp.legendMeasured'), approx: t('exp.legendApprox'), random: t('exp.legendRandom') }
  });
}

function runExperiment() {
  const status = $('#experimentStatus');
  const plain = experimentPlain();
  if (plain.length < EXPERIMENT_MIN_LETTERS) return setStatus(status, t('exp.tooShort', { n: plain.length, min: EXPERIMENT_MIN_LETTERS }), true);
  const input = $('#experimentTrials');
  const trials = Number(input.value);
  if (!Number.isInteger(trials) || trials < 1 || trials > 50) return setStatus(status, t('exp.badTrials'), true);
  const r = keyLengthExperiment(plain, EXPERIMENT_LENGTHS, Math.random, trials);
  state.experiment = r;
  const row = (L) => r.rows.find((x) => x.L === L);
  $('#experimentSummary').textContent = t('exp.summary', {
    n: fmt(plain.length), kp: formatIC(r.kp), m5: formatIC(row(5).measured), a5: formatIC(row(5).approx), m20: formatIC(row(20).measured)
  });
  const rows = r.rows.map((x) => el('tr', {}, [
    el('td', { text: String(x.L) }), el('td', { text: formatIC(x.measured) }), el('td', { text: formatIC(x.approx) })
  ]));
  $('#experimentTable tbody').replaceChildren(...rows);
  $('#experimentResult').hidden = false;
  drawExperimentChart();
  setStatus(status, t('exp.done', { trials }));
}

function initAdvanced() {
  $('#thresholdText').textContent = String(KEY_IC_THRESHOLD);
  renderLanguageTable();
  $('#estimateKeyLength').addEventListener('click', estimateKeyLength);
  $('#loadVigenereSample').addEventListener('click', () => {
    $('#vigenereText').value = SAMPLES.vigenere;
    estimateKeyLength();
  });
  $('#runExperiment').addEventListener('click', runExperiment);
}

// URL の ?text= を、サンプル分析と鍵長推定の両方に入れて実行する。?tab= で開くタブを選ぶ
function applyParams(tabs) {
  const { text, tab } = readParams(window.location.search);
  if (text) {
    for (const b of document.querySelectorAll('.sample-btn')) b.setAttribute('aria-pressed', String(b.dataset.sample === 'custom'));
    $('#sampleNote').textContent = t('sample.url');
    $('#analyzeText').value = text;
    analyze();
    $('#vigenereText').value = text;
    estimateKeyLength();
  }
  if (tab || text) tabs.select(tab || 'analyze');
}

function redrawCharts() {
  if (!$('#panel-monte').hidden) drawMonteChart();
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

// ===== 初期化 =====
function init() {
  initThemeToggle($('#btnTheme'));
  initSteps();
  initAnalysis();
  initMonte();
  initAdvanced();
  initHelp();
  const tabs = initTabs($('.tabs'), redrawCharts);
  // テーマが変わったら、canvas の色を描き直す
  new MutationObserver(redrawCharts).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawCharts);
  window.addEventListener('resize', redrawCharts);
  resetMonte();
  applyParams(tabs);
  document.documentElement.setAttribute('data-ready', 'true');
}

init();
