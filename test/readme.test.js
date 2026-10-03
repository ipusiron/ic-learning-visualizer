import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeText, icDetail, classifyIC, keyLengthCandidates, standardError, formatIC, BANDS, MIN_VERDICT, SHORT_BELOW, KEY_IC_THRESHOLD
} from '../js/ic-core.js';
import { SAMPLES, SAMPLE_ORDER, LANGUAGE_IC, VIGENERE_KEY, RANDOM_LENGTH, ENGLISH } from '../js/samples.js';
import { MESSAGES } from '../js/messages.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const md = read('README.md');
const fmt = (n) => n.toLocaleString('en-US');
const JA = MESSAGES.ja;

function section(text, heading) {
  const i = text.indexOf(`\n## ${heading}`);
  assert.ok(i >= 0, heading);
  const rest = text.slice(i + 1);
  const end = rest.indexOf('\n## ', 3);
  return end < 0 ? rest : rest.slice(0, end);
}

// firstHeader で始まる表の本体の行（見出しと区切りの行を除く）を、セルの配列にする
function table(text, firstHeader) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`| ${firstHeader} |`));
  assert.ok(start >= 0, firstHeader);
  const rows = [];
  for (let i = start + 2; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
  return rows;
}

const h2 = md.replace(/```[\s\S]*?```/g, '').split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3));
const analyzed = (k) => {
  const d = icDetail(normalizeText(SAMPLES[k]).text);
  return { ...d, band: classifyIC(d.ic, d.N).band };
};

test('YAML メタデータの構造（キーの順、ブロック形式のリスト、固定の値）', () => {
  const m = md.match(/^<!--\n---\n([\s\S]*?)\n---\n-->\n/);
  assert.ok(m, 'YAML block');
  const yaml = m[1];
  const keys = [...yaml.matchAll(/^([a-z_]+):/gm)].map((x) => x[1]);
  assert.deepEqual(keys, ['id', 'slug', 'title', 'subtitle_ja', 'subtitle_en', 'description_ja', 'description_en',
    'category_ja', 'category_en', 'difficulty', 'tags', 'repo_url', 'demo_url', 'hub']);
  for (const k of ['category_ja', 'category_en', 'tags']) assert.match(yaml, new RegExp(`^${k}:\\n  - `, 'm'), k);
  assert.match(yaml, /^id: day047$/m);
  assert.match(yaml, /^slug: ic-learning-visualizer$/m);
  assert.match(yaml, /^repo_url: "https:\/\/github.com\/ipusiron\/ic-learning-visualizer"$/m);
  assert.match(yaml, /^demo_url: "https:\/\/ipusiron.github.io\/ic-learning-visualizer\/"$/m);
  assert.match(yaml, /^hub: true$/m);
});

test('シリーズ標準の構成（前半と後半の見出しの順、Day の表記、プロジェクトのリンク）', () => {
  assert.match(md, /\n# IC Learning Visualizer - .+\n/);
  assert.ok(md.includes('**Day047 - 生成AIで作るセキュリティツール100**'));
  assert.ok(h2[0].startsWith('🌐'));
  assert.ok(h2[1].startsWith('📸'));
  assert.deepEqual(h2.slice(-4).map((h) => [...h][0]), ['📁', '💻', '📄', '🛠']);
  for (const icon of ['✨', '📖', '🎯', '🔒', '⚠', '🧪']) assert.ok(h2.some((h) => h.startsWith(icon)), icon);
  assert.match(section(md, '🛠️ このツールについて'), /https:\/\/akademeia\.info\/\?page_id=42163/);
  for (const b of ['stars', 'forks', 'last-commit', 'license']) assert.ok(md.includes(`img.shields.io/github/${b}/ipusiron/ic-learning-visualizer`), b);
  // Worker は使っていないので、README にも書かない
  assert.doesNotMatch(md, /Web Worker|worker\.js|PERFORMANCE_IMPROVEMENTS/);
});

test('強調は1節に2か所まで、箇条書きの項目名を太字にしない', () => {
  for (const h of h2) {
    const n = (section(md, h).match(/\*\*[^*\n]+\*\*/g) || []).length;
    assert.ok(n <= 2, `${h}: ${n}`);
  }
  assert.doesNotMatch(md, /^\s*- \*\*/m);
});

test('区分の表は実装の境界と一致し、判定の下限（50字）と短い文の印（200字）も一致する', () => {
  const sec = section(md, '📊 区分の基準とサンプル');
  const rows = table(sec, '区分');
  assert.deepEqual(rows.map((r) => r[0]), ['flat', 'middle', 'language', 'skewed'].map((b) => JA[`band.${b}`]));
  const f = (x) => String(Number(x.toFixed(3)));
  assert.equal(rows[0][1], `${f(BANDS.middle)}未満`);
  assert.equal(rows[1][1], `${f(BANDS.middle)}〜${f(BANDS.language)}`);
  assert.equal(rows[2][1], `${f(BANDS.language)}〜${BANDS.skewed.toFixed(2)}`);
  assert.equal(rows[3][1], `${BANDS.skewed.toFixed(2)}以上`);
  assert.ok(sec.includes(`${MIN_VERDICT}字未満は判定せず、${SHORT_BELOW}字未満の短い文`));
});

test('サンプルの表（文字数・IC・区分）は実装の結果と一致する', () => {
  const rows = table(section(md, '📊 区分の基準とサンプル'), 'サンプル');
  assert.equal(rows.length, SAMPLE_ORDER.length);
  rows.forEach(([, n, ic, band], i) => {
    const a = analyzed(SAMPLE_ORDER[i]);
    assert.deepEqual([n, ic, band], [fmt(a.N), formatIC(a.ic), JA[`band.${a.band}`]], SAMPLE_ORDER[i]);
  });
  assert.ok(md.includes(`一様な${RANDOM_LENGTH}字`));
  assert.ok(md.includes(`鍵${VIGENERE_KEY}で暗号化したもの`));
});

test('鍵長推定の表と本文（しきい値・候補・全体のIC・大きい順だけのときの1位）は実装と一致する', () => {
  const sec = section(md, '🔑 鍵長推定の仕組み');
  const text = normalizeText(SAMPLES.vigenere).text;
  const r = keyLengthCandidates(text);
  const ic = Object.fromEntries(r.curve.map((p) => [p.k, p.ic]));
  const rows = table(sec, '周期');
  assert.ok(rows.length >= 4);
  for (const [k, v] of rows) assert.equal(v, formatIC(ic[Number(k)]), k);
  const hits = r.candidates.filter((k) => ic[k] >= KEY_IC_THRESHOLD);
  assert.equal(r.candidates[0], VIGENERE_KEY.length);
  assert.ok(sec.includes(`0.058以上になる周期は${hits.join('・')}で、候補の1位は${r.candidates[0]}`));
  assert.equal(KEY_IC_THRESHOLD, 0.058);
  const byIC = [...r.curve].sort((a, b) => b.ic - a.ic)[0].k;
  assert.ok(sec.includes(`周期${byIC}（${formatIC(ic[byIC])}）が周期${r.candidates[0]}（${formatIC(ic[r.candidates[0]])}）より上に来る`));
  assert.ok(sec.includes(`全体のICは${formatIC(r.whole)}`));
});

test('モンテカルロのばらつきの目安（標準誤差の2倍）は英語のサンプルの IC から計算した値', () => {
  const sec = section(md, '🎲 モンテカルロ実験の仕組み');
  const p = analyzed('english').ic;
  assert.ok(sec.includes(`英語のサンプル（IC ${formatIC(p)}）なら、1,000回で約±${(2 * standardError(p, 1000)).toFixed(3)}`));
  assert.ok(sec.includes(`20,000回で約±${(2 * standardError(p, 20000)).toFixed(4)}`));
});

test('言語ごとの IC の表は js/samples.js と一致し、画面とも同じ値（正規化値÷26）', () => {
  const rows = table(section(md, '📊 言語ごとのIC'), '言語');
  assert.equal(rows.length, LANGUAGE_IC.length);
  rows.forEach(([name, f, d], i) => {
    const l = LANGUAGE_IC[i];
    assert.equal(name, JA[`lang.${l.id}`]);
    assert.equal(f, `${l.friedman.toFixed(2)} → ${formatIC(l.friedman / 26)}`);
    assert.equal(d, l.dcode === null ? '—' : formatIC(l.dcode));
  });
});

test('about_ic.md の計算例（英語のサンプル）と言語ごとの表は実装と一致する', () => {
  const doc = read('about_ic.md');
  const d = icDetail(normalizeText(ENGLISH).text);
  assert.ok(doc.includes(`$N=${d.N}$`));
  assert.ok(doc.includes(`の合計は ${fmt(d.pairs)}`));
  assert.ok(doc.includes(`$N(N-1) = ${d.N} \\times ${d.N - 1} = ${fmt(d.denom)}$`));
  assert.ok(doc.includes(`\\frac{${d.pairs}}{${d.denom}} \\approx ${formatIC(d.ic)}`));
  for (const l of LANGUAGE_IC) {
    const dc = l.dcode === null ? '—' : formatIC(l.dcode);
    assert.ok(doc.includes(`| ${JA[`lang.${l.id}`]} | ${l.friedman.toFixed(2)} → ${formatIC(l.friedman / 26)} | ${dc} |`), l.id);
  }
  assert.doesNotMatch(doc, /231,900|0\.0775/);
});

test('ディレクトリー構造にすべてのファイルとディレクトリーが載り、全行に説明がある', () => {
  const block = section(md, '📁 ディレクトリー構造').match(/```\n([\s\S]*?)```/)[1];
  const lines = block.split('\n').filter(Boolean).slice(1);
  const listed = new Set();
  for (const line of lines) {
    const m = line.match(/^[│├└─\s]*([^\s#]+)\s+# (.+)$/);
    assert.ok(m, `説明のない行: ${line}`);
    listed.add(m[1].replace(/\/$/, ''));
  }
  const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .filter((x) => !['.git', 'node_modules', '.claude'].includes(x.name))
    .flatMap((x) => (x.isDirectory() ? [x.name, ...walk(path.join(dir, x.name))] : [x.name]));
  const all = walk('.');
  for (const name of all) assert.ok(listed.has(name), `ツリーにない: ${name}`);
  for (const name of listed) assert.ok(all.includes(name), `実在しない: ${name}`);
  const cols = new Set(lines.map((l) => l.indexOf(' # ')));
  assert.equal(cols.size, 1, [...cols].join(','));
});

test('画像: 参照はすべて実在し（300KB以下）、assets/ の PNG は README から参照しているものだけ', () => {
  const refs = [...md.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map((m) => m[1]);
  assert.equal(refs.length, 4);
  for (const r of refs) {
    assert.ok(fs.existsSync(path.join(ROOT, r)), r);
    assert.ok(fs.statSync(path.join(ROOT, r)).size <= 300 * 1024, r);
  }
  const pngs = fs.readdirSync(path.join(ROOT, 'assets')).filter((f) => f.endsWith('.png')).map((f) => `assets/${f}`).sort();
  assert.deepEqual(pngs, [...new Set(refs)].sort());
});
