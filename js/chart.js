// グラフ（canvas）: モンテカルロの収束、周期ごとのIC、鍵長とICの実験。
// 高解像度の画面では devicePixelRatio に合わせて描く。色は style.css の変数（--chart-*）から取るので、ライト・ダークに追従する

import { chartMax, standardError, RANDOM_IC } from './ic-core.js';

const HEIGHT = 220;
const M = { left: 56, right: 28, top: 16, bottom: 44 };
const FONT = '12px system-ui, -apple-system, "Segoe UI", sans-serif';

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function yStep(max) {
  if (max <= 0.12) return 0.02;
  if (max <= 0.3) return 0.05;
  return 0.1;
}

// canvas の大きさを決めて、描く範囲（plot）と縦軸の変換を返す
function frame(canvas, yMax) {
  const width = Math.max(240, Math.floor(canvas.clientWidth || canvas.parentElement.clientWidth || 300));
  const dpr = window.devicePixelRatio || 1;
  canvas.style.height = `${HEIGHT}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(HEIGHT * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, HEIGHT);
  ctx.font = FONT;
  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const y = (v) => M.top + plotH - (Math.max(0, Math.min(v, yMax)) / yMax) * plotH;
  return { ctx, width, plotW, plotH, y };
}

// 縦の目盛り・軸・軸の名前。xTicks は [{ x, label }]
function axes(f, yMax, xTicks, labels) {
  const { ctx, width, plotW, plotH, y } = f;
  ctx.fillStyle = cssVar('--chart-text');
  ctx.strokeStyle = cssVar('--chart-grid');
  ctx.lineWidth = 1;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const step = yStep(yMax);
  for (let v = 0; v <= yMax + 1e-9; v += step) {
    const yy = Math.round(y(v)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(M.left, yy);
    ctx.lineTo(M.left + plotW, yy);
    ctx.stroke();
    ctx.fillText(v.toFixed(2), M.left - 6, yy);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const tick of xTicks) ctx.fillText(tick.label, tick.x, M.top + plotH + 6);
  ctx.fillText(labels.x || '', M.left + plotW / 2, HEIGHT - 18);
  ctx.save();
  ctx.translate(14, M.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'middle';
  ctx.fillText(labels.y || '', 0, 0);
  ctx.restore();
  ctx.strokeStyle = cssVar('--chart-axis');
  ctx.beginPath();
  ctx.moveTo(M.left + 0.5, M.top);
  ctx.lineTo(M.left + 0.5, M.top + plotH + 0.5);
  ctx.lineTo(M.left + plotW, M.top + plotH + 0.5);
  ctx.stroke();
  return width;
}

// 横の破線（理論値・しきい値・1/26）と、その名前（右端。left なら左端）
function hLine(f, value, color, label, dash = [6, 5], left = false) {
  const { ctx, plotW, y } = f;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(M.left, y(value));
  ctx.lineTo(M.left + plotW, y(value));
  ctx.stroke();
  ctx.setLineDash([]);
  if (label) {
    ctx.fillStyle = color;
    ctx.textAlign = left ? 'left' : 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, left ? M.left + 6 : M.left + plotW - 4, y(value) - 4);
  }
}

// モンテカルロの収束グラフ。opts: { history: [{ trial, rate }], theory, total, band, labels: { x, y, theory } }
// band が true なら、理論値 ± 2×標準誤差（その回数でのばらつきの目安）の帯を描く
export function drawConvergence(canvas, opts) {
  const { history = [], theory = 0, total = 0, band = false, labels = {} } = opts;
  const yMax = chartMax([theory, ...history.map((p) => p.rate)]);
  const f = frame(canvas, yMax);
  const xMax = Math.max(total, history.length ? history[history.length - 1].trial : 0, 1);
  const x = (v) => M.left + (v / xMax) * f.plotW;
  axes(f, yMax, [0, 1, 2, 3, 4].map((i) => {
    const v = Math.round((xMax / 4) * i);
    return { x: x(v), label: v.toLocaleString() };
  }), labels);
  const { ctx, y } = f;
  if (band && theory > 0 && total > 0) {
    const pts = [];
    const steps = 80;
    for (let i = 1; i <= steps; i++) {
      const n = Math.max(1, Math.round((total / steps) * i));
      pts.push([n, 2 * standardError(theory, n)]);
    }
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = cssVar('--chart-theory');
    ctx.beginPath();
    pts.forEach(([n, d], i) => (i === 0 ? ctx.moveTo(x(n), y(theory + d)) : ctx.lineTo(x(n), y(theory + d))));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(x(pts[i][0]), y(theory - pts[i][1]));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (theory > 0) hLine(f, theory, cssVar('--chart-theory'), labels.theory || '');
  if (history.length) {
    ctx.strokeStyle = cssVar('--chart-line');
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((p, i) => (i === 0 ? ctx.moveTo(x(p.trial), y(p.rate)) : ctx.lineTo(x(p.trial), y(p.rate))));
    ctx.stroke();
    const last = history[history.length - 1];
    ctx.fillStyle = cssVar('--chart-line');
    ctx.beginPath();
    ctx.arc(x(last.trial), y(last.rate), 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 周期ごとのIC（κテストの一致率にも使う）の棒グラフ。
// opts: { curve: [{ k, ic }], threshold, selected, wholeFirst, lines: [{ value, label }], labels: { x, y, threshold } }
// しきい値以上は色を変える。wholeFirst なら周期1（分けない全体）を別の色に。selected の棒は枠で囲む
// 戻り値は、canvas の横の位置から周期を求める関数（棒を押して選ぶため）
export function drawPeriodic(canvas, opts) {
  const { curve = [], threshold = 0, selected = null, wholeFirst = true, lines = [], labels = {} } = opts;
  const yMax = chartMax([threshold, ...curve.map((p) => p.ic), ...lines.map((l) => l.value)]);
  const f = frame(canvas, yMax);
  const maxK = Math.max(1, ...curve.map((p) => p.k));
  const slot = f.plotW / maxK;
  const cx = (k) => M.left + slot * (k - 0.5);
  const every = slot < 18 ? 2 : 1;
  axes(f, yMax, curve.filter((p) => p.k === 1 || p.k % every === 0).map((p) => ({ x: cx(p.k), label: String(p.k) })), labels);
  const { ctx, y } = f;
  const bw = Math.max(3, slot * 0.6);
  for (const p of curve) {
    ctx.fillStyle = cssVar(wholeFirst && p.k === 1 ? '--bar-random' : p.ic >= threshold ? '--bar-english' : '--bar-current');
    ctx.fillRect(cx(p.k) - bw / 2, y(p.ic), bw, y(0) - y(p.ic));
    if (p.k === selected) {
      ctx.strokeStyle = cssVar('--chart-text');
      ctx.lineWidth = 2;
      ctx.strokeRect(cx(p.k) - bw / 2 - 3, M.top, bw + 6, y(0) - M.top);
    }
  }
  for (const l of lines) hLine(f, l.value, cssVar('--chart-axis'), l.label, [2, 4], true);
  // 名前は左端に（右端の棒は鍵長の倍数で高くなりやすく、重なるため）
  if (threshold > 0) hLine(f, threshold, cssVar('--chart-theory'), labels.threshold || '', [6, 5], true);
  return (clientX) => {
    const k = Math.ceil((clientX - M.left) / slot);
    return k >= 1 && k <= maxK ? k : null;
  };
}

// IC の分布のヒストグラム。opts: { values, marks: [{ value, label }], labels: { x, y } }。横軸は 0〜0.15（それより大きい値は右端の棒に入れる）
export function drawHistogram(canvas, opts) {
  const { values = [], marks = [], labels = {} } = opts;
  const X_MAX = 0.15;
  const BINS = 60;
  const counts = new Array(BINS).fill(0);
  for (const v of values) counts[Math.min(BINS - 1, Math.max(0, Math.floor((v / X_MAX) * BINS)))] += 1;
  const top = Math.max(1, ...counts);
  // 縦軸は回数なので、0〜1 に直して描き、目盛りの代わりに最大の回数を書く。
  // いちばん高い棒を高さの7割に留め、上の3割に区分の名前を置く（名前が棒を隠さないように）
  const TALLEST = 0.7;
  const h = (c) => (c / top) * TALLEST;
  const f = frame(canvas, 1);
  const x = (v) => M.left + (v / X_MAX) * f.plotW;
  const ticks = [0, 0.03, 0.06, 0.09, 0.12, 0.15].map((v) => ({ x: x(v), label: v.toFixed(2) }));
  const { ctx, y, plotW, plotH } = f;
  ctx.fillStyle = cssVar('--chart-text');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const t of ticks) ctx.fillText(t.label, t.x, M.top + plotH + 6);
  ctx.fillText(labels.x || '', M.left + plotW / 2, HEIGHT - 18);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(top), M.left - 6, y(TALLEST));
  ctx.fillText('0', M.left - 6, y(0));
  ctx.save();
  ctx.translate(14, M.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(labels.y || '', 0, 0);
  ctx.restore();
  ctx.strokeStyle = cssVar('--chart-axis');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M.left + 0.5, M.top);
  ctx.lineTo(M.left + 0.5, M.top + plotH + 0.5);
  ctx.lineTo(M.left + plotW, M.top + plotH + 0.5);
  ctx.stroke();
  const bw = plotW / BINS;
  ctx.fillStyle = cssVar('--bar-current');
  counts.forEach((c, i) => {
    if (!c) return;
    ctx.fillRect(M.left + i * bw + 0.5, y(h(c)), Math.max(1, bw - 1), y(0) - y(h(c)));
  });
  // 区分の境目などの縦の線と、その名前（上端）。名前は棒に重なっても読めるよう、背景色の帯の上に書く
  ctx.font = FONT;
  for (const m of marks) {
    ctx.strokeStyle = cssVar('--chart-theory');
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x(m.value), M.top);
    ctx.lineTo(x(m.value), M.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  marks.forEach((m, i) => {
    const lx = x(m.value) + 3;
    const ly = M.top + 2 + (i % 3) * 16;
    const w = ctx.measureText(m.label).width;
    ctx.fillStyle = cssVar('--surface');
    ctx.fillRect(lx - 2, ly - 1, w + 4, 15);
    ctx.fillStyle = cssVar('--chart-theory');
    ctx.fillText(m.label, lx, ly);
  });
}

// 鍵長とICの実験のグラフ。opts: { rows: [{ L, measured, approx }], labels: { x, y, measured, approx, random } }
// 実験の平均は点と実線、近似式は破線、1/26 は点線
export function drawExperiment(canvas, opts) {
  const { rows = [], labels = {} } = opts;
  const yMax = chartMax([...rows.map((r) => r.measured), ...rows.map((r) => r.approx)]);
  const f = frame(canvas, yMax);
  const maxL = Math.max(1, ...rows.map((r) => r.L));
  const x = (L) => M.left + ((L - 1) / Math.max(1, maxL - 1)) * f.plotW;
  axes(f, yMax, rows.filter((r) => r.L === 1 || r.L % 5 === 0).map((r) => ({ x: x(r.L), label: String(r.L) })), labels);
  const { ctx, y } = f;
  hLine(f, RANDOM_IC, cssVar('--chart-axis'), labels.random || '', [2, 4]);
  ctx.strokeStyle = cssVar('--chart-theory');
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  rows.forEach((r, i) => (i === 0 ? ctx.moveTo(x(r.L), y(r.approx)) : ctx.lineTo(x(r.L), y(r.approx))));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = cssVar('--chart-line');
  ctx.fillStyle = cssVar('--chart-line');
  ctx.beginPath();
  rows.forEach((r, i) => (i === 0 ? ctx.moveTo(x(r.L), y(r.measured)) : ctx.lineTo(x(r.L), y(r.measured))));
  ctx.stroke();
  for (const r of rows) {
    ctx.beginPath();
    ctx.arc(x(r.L), y(r.measured), 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // 凡例（右上）
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = cssVar('--chart-line');
  ctx.fillText(labels.measured || '', M.left + f.plotW - 4, M.top + 2);
  ctx.fillStyle = cssVar('--chart-theory');
  ctx.fillText(labels.approx || '', M.left + f.plotW - 4, M.top + 18);
}
