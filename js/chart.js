// モンテカルロの収束グラフ（canvas）。高解像度の画面では devicePixelRatio に合わせて描く。
// 色は style.css の変数（--chart-*）から取るので、ライト・ダークの切り替えに追従する

import { chartMax } from './ic-core.js';

const HEIGHT = 220;
const M = { left: 56, right: 16, top: 16, bottom: 44 };

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function yStep(max) {
  if (max <= 0.12) return 0.02;
  if (max <= 0.3) return 0.05;
  return 0.1;
}

// opts: { history: [{ trial, rate }], theory, total, labels: { x, y, theory } }
export function drawConvergence(canvas, opts) {
  const { history = [], theory = 0, total = 0, labels = {} } = opts;
  const width = Math.max(240, Math.floor(canvas.clientWidth || canvas.parentElement.clientWidth || 300));
  const dpr = window.devicePixelRatio || 1;
  canvas.style.height = `${HEIGHT}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(HEIGHT * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, HEIGHT);

  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const yMax = chartMax([theory, ...history.map((p) => p.rate)]);
  const xMax = Math.max(total, history.length ? history[history.length - 1].trial : 0, 1);
  const x = (v) => M.left + (v / xMax) * plotW;
  const y = (v) => M.top + plotH - (Math.min(v, yMax) / yMax) * plotH;
  const font = '12px system-ui, -apple-system, "Segoe UI", sans-serif';

  // 目盛り（縦）
  ctx.font = font;
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
  // 目盛り（横）
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= 4; i++) {
    const v = Math.round((xMax / 4) * i);
    ctx.fillText(v.toLocaleString(), x(v), M.top + plotH + 6);
  }
  // 軸の名前（横は下端の内側、縦は左端に回して）
  ctx.fillText(labels.x || '', M.left + plotW / 2, HEIGHT - 18);
  ctx.save();
  ctx.translate(14, M.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'middle';
  ctx.fillText(labels.y || '', 0, 0);
  ctx.restore();
  // 軸
  ctx.strokeStyle = cssVar('--chart-axis');
  ctx.beginPath();
  ctx.moveTo(M.left + 0.5, M.top);
  ctx.lineTo(M.left + 0.5, M.top + plotH + 0.5);
  ctx.lineTo(M.left + plotW, M.top + plotH + 0.5);
  ctx.stroke();

  // 理論値の線
  if (theory > 0) {
    ctx.strokeStyle = cssVar('--chart-theory');
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(M.left, y(theory));
    ctx.lineTo(M.left + plotW, y(theory));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cssVar('--chart-theory');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(labels.theory || '', M.left + plotW - 4, y(theory) - 4);
  }

  // 実験の値の線
  if (history.length) {
    ctx.strokeStyle = cssVar('--chart-line');
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((p, i) => {
      if (i === 0) ctx.moveTo(x(p.trial), y(p.rate));
      else ctx.lineTo(x(p.trial), y(p.rate));
    });
    ctx.stroke();
    const last = history[history.length - 1];
    ctx.fillStyle = cssVar('--chart-line');
    ctx.beginPath();
    ctx.arc(x(last.trial), y(last.rate), 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
