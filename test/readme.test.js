import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeText, icDetail, classifyIC, keyLengthCandidates, standardError, formatIC, expectedRate, keyLengthExperiment, encryptVigenere,
  xorshift32, BANDS, MIN_VERDICT, SHORT_BELOW, KEY_IC_THRESHOLD, kappa, kappaCurve, columnDetails, friedmanEstimate, lengthSpread
} from '../js/ic-core.js';
import { SAMPLES, SAMPLE_ORDER, LANGUAGE_IC, VIGENERE_KEY, VIGENERE_PLAIN, RANDOM_LENGTH, ENGLISH } from '../js/samples.js';
import { MESSAGES } from '../js/messages.js';
import { MAX_PARAM_TEXT } from '../js/params.js';
import { substitution, columnar, randomKey, compareCiphers } from '../js/ciphers.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const fmt = (n) => n.toLocaleString('en-US');
const f3 = (x) => String(Number(x.toFixed(3)));

// 実装から計算する値（日英で共通）
const analyzed = (k) => {
  const d = icDetail(normalizeText(SAMPLES[k]).text);
  return { ...d, band: classifyIC(d.ic, d.N).band };
};
const vig = normalizeText(SAMPLES.vigenere).text;
const key = keyLengthCandidates(vig);
const icOf = Object.fromEntries(key.curve.map((p) => [p.k, p.ic]));
const hits = key.candidates.filter((k) => icOf[k] >= KEY_IC_THRESHOLD);
const byIC = [...key.curve].sort((a, b) => b.ic - a.ic)[0].k;
const english = normalizeText(ENGLISH).text;
const engIC = icDetail(english).ic;
const plain = normalizeText(VIGENERE_PLAIN).text;
const EXP_SEED = 20261003;
const EXP_KEYS = 40;
const exp = keyLengthExperiment(plain, Array.from({ length: 20 }, (_, i) => i + 1), xorshift32(EXP_SEED), EXP_KEYS);
const urlText = normalizeText(encryptVigenere(VIGENERE_PLAIN.split('. ')[0], VIGENERE_KEY)).text;
// 第3弾: 列の中身・κ・フリードマンの式（サンプルの暗号文）、暗号の種類の比較（種20261004）、ばらつき（種1・1,000回）
const cols5 = columnDetails(vig, 5).map((c) => formatIC(c.ic));
const kp = (k) => formatIC(kappa(vig, k).rate);
const fr = friedmanEstimate(vig);
const COMPARE_SEED = 20261004;
const SPREAD_SEED = 1;
const SPREAD_TRIALS = 1000;
const corpusText = read('corpus/eval-pg98.txt').replace(/[^A-Z]/g, '');

const DOCS = {
  ja: {
    file: 'README.md',
    switcher: '[English](README.en.md) · 日本語',
    day: '**Day047 - 生成AIで作るセキュリティツール100**',
    msg: MESSAGES.ja,
    images: /^assets\/screenshot\d*\.png$/,
    sec: {
      bands: '📊 区分の基準とサンプル', experiment: '🧪 鍵長とICの実験', key: '🔑 鍵長推定の仕組み', monte: '🎲 モンテカルロ実験の仕組み',
      lang: '📊 言語ごとのIC', url: '🔗 URLで文字列を渡す', tree: '📁 ディレクトリー構造', about: '🛠️ このツールについて',
      spread: '📏 文字数とICのばらつき', compare: '🧪 暗号の種類とICの比較', inside: '🔍 鍵長推定の中身（列・κテスト・フリードマンの式）'
    },
    heads: { bands: '区分', samples: 'サンプル', experiment: '鍵長', key: '周期', lang: '言語', spread: '文字数', compare: '方式', accuracy: '文字数' },
    range: [(a) => `${a}未満`, (a, b) => `${a}〜${b}`, (a, b) => `${a}〜${b}`, (a) => `${a}以上`],
    claims: [
      `${MIN_VERDICT}字未満は判定せず、${SHORT_BELOW}字未満の短い文`,
      `一様な${RANDOM_LENGTH}字`,
      `鍵${VIGENERE_KEY}で暗号化したもの`,
      `平文（${plain.length}字、IC ${formatIC(exp.kp)}）で、決まった種（${EXP_SEED}）の乱数で鍵長ごとに${EXP_KEYS}個の鍵`,
      `${KEY_IC_THRESHOLD}以上になる周期は${hits.join('・')}で、候補の1位は${key.candidates[0]}`,
      `周期${byIC}（${formatIC(icOf[byIC])}）が周期${key.candidates[0]}（${formatIC(icOf[key.candidates[0]])}）より上に来る`,
      `全体のICは${formatIC(key.whole)}`,
      `英語のサンプルではICが${formatIC(engIC)}、Σ(n/N)²が${formatIC(expectedRate(english, true))}`,
      `英語のサンプル（IC ${formatIC(engIC)}）なら、1,000回で約±${(2 * standardError(engIC, 1000)).toFixed(3)}`,
      `20,000回で約±${(2 * standardError(engIC, 20000)).toFixed(4)}`,
      `#text=${urlText}&tab=advanced`,
      `最初の1文、${urlText.length}字。開くと鍵長の候補の1位が${keyLengthCandidates(urlText).candidates[0]}になる`,
      `文字列は${fmt(MAX_PARAM_TEXT)}字まで`,
      `種に${EXP_SEED}、鍵の数に${EXP_KEYS}を入れると、この表と同じ値になる`,
      `列のICは${cols5.join('・')}（平均${formatIC(icOf[5])}）`,
      `k＝5で${kp(5)}、k＝10で${kp(10)}、k＝3で${kp(3)}`,
      `サンプル（${fr.N}字、IC ${formatIC(fr.ic)}）では約${fr.estimate.toFixed(2)}で、四捨五入すると${Math.round(fr.estimate)}になり`,
      `乱数の種${COMPARE_SEED}、ヴィジュネル暗号の鍵長5`,
      `乱数の種${SPREAD_SEED}・${fmt(SPREAD_TRIALS)}回`
    ]
  },
  en: {
    file: 'README.en.md',
    switcher: 'English · [日本語](README.md)',
    day: '**Day047 - 100 Security Tools with Generative AI**',
    msg: MESSAGES.en,
    images: /^assets\/en\/screenshot\d*\.png$/,
    sec: {
      bands: '📊 Bands and samples', experiment: '🧪 Key length and IC experiment', key: '🔑 How key length estimation works',
      monte: '🎲 How the Monte Carlo experiment works', lang: '📊 IC by language', url: '🔗 Passing text in the URL', tree: '📁 Directory structure',
      about: '🛠️ About this tool', spread: '📏 Text length and IC spread', compare: '🧪 Types of cipher and IC',
      inside: '🔍 Inside key length estimation (columns, kappa test, Friedman formula)'
    },
    heads: { bands: 'Band', samples: 'Sample', experiment: 'Key length', key: 'Period', lang: 'Language', spread: 'Letters', compare: 'Method',
      accuracy: 'Letters' },
    range: [(a) => `below ${a}`, (a, b) => `${a}-${b}`, (a, b) => `${a}-${b}`, (a) => `${a} or more`],
    claims: [
      `Texts under ${MIN_VERDICT} letters are not classified, and texts under ${SHORT_BELOW} letters`,
      `${RANDOM_LENGTH} uniform letters`,
      `encrypted with the key ${VIGENERE_KEY}`,
      `(${plain.length} letters, IC ${formatIC(exp.kp)}) and ${EXP_KEYS} keys for each length from a random generator with a fixed seed (${EXP_SEED})`,
      `The periods at ${KEY_IC_THRESHOLD} or more are ${hits.slice(0, -1).join(', ')} and ${hits.at(-1)}, and the first candidate is ${key.candidates[0]}`,
      `would put period ${byIC} (${formatIC(icOf[byIC])}) above period ${key.candidates[0]} (${formatIC(icOf[key.candidates[0]])})`,
      `The IC of the whole text (no split) is ${formatIC(key.whole)}`,
      `For the English sample, IC is ${formatIC(engIC)} and Σ(n/N)² is ${formatIC(expectedRate(english, true))}`,
      `For the English sample (IC ${formatIC(engIC)}), it is about ±${(2 * standardError(engIC, 1000)).toFixed(3)} after 1,000 trials`,
      `about ±${(2 * standardError(engIC, 20000)).toFixed(4)} after 20,000 trials`,
      `#text=${urlText}&tab=advanced`,
      `the first sentence of the Vigenère cipher sample, ${urlText.length} letters; the first key length candidate is `
        + `${keyLengthCandidates(urlText).candidates[0]}`,
      `The text takes up to ${fmt(MAX_PARAM_TEXT)} characters`,
      `With seed ${EXP_SEED} and ${EXP_KEYS} keys, it gives the same values as this table`,
      `column ICs of ${cols5.slice(0, -1).join(', ')} and ${cols5.at(-1)} (average ${formatIC(icOf[5])})`,
      `the rate is ${kp(5)} at k = 5, ${kp(10)} at k = 10 and ${kp(3)} at k = 3`,
      `For the sample (${fr.N} letters, IC ${formatIC(fr.ic)}), it gives about ${fr.estimate.toFixed(2)}, which rounds to ${Math.round(fr.estimate)}`,
      `random seed ${COMPARE_SEED} and a Vigenère key length of 5`,
      `With random seed ${SPREAD_SEED} and ${fmt(SPREAD_TRIALS)} windows`
    ]
  }
};
for (const d of Object.values(DOCS)) d.text = read(d.file);

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

const h2 = (md) => md.replace(/```[\s\S]*?```/g, '').split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3));
const headings = (md) => md.replace(/```[\s\S]*?```/g, '').split('\n').filter((l) => /^#{1,4} /.test(l));

test('README の例の前提: URL の例はサンプルの最初の1文で、鍵長の候補の1位は5。実験の鍵長1は平文と同じ', () => {
  assert.equal(urlText.length, 63);
  assert.equal(keyLengthCandidates(urlText).candidates[0], VIGENERE_KEY.length);
  assert.ok(Math.abs(exp.rows[0].measured - exp.kp) < 1e-12);
  assert.equal(key.candidates[0], VIGENERE_KEY.length);
});

test('YAML メタデータの構造（キーの順、ブロック形式のリスト、固定の値）。YAML は README.md だけに置く', () => {
  const m = DOCS.ja.text.match(/^<!--\n---\n([\s\S]*?)\n---\n-->\n/);
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
  assert.doesNotMatch(DOCS.en.text, /^<!--/);
});

test('日英の README は同じ見出しを同じ順に持つ（階層と絵文字がそろう）', () => {
  const ja = headings(DOCS.ja.text);
  const en = headings(DOCS.en.text);
  assert.equal(en.length, ja.length);
  ja.forEach((h, i) => {
    assert.equal(en[i].match(/^#+/)[0], h.match(/^#+/)[0], `${h} / ${en[i]}`);
    if (h.startsWith('## ') || h.startsWith('### ')) assert.equal([...en[i].replace(/^#+ /, '')][0], [...h.replace(/^#+ /, '')][0], `${h} / ${en[i]}`);
  });
});

for (const [lang, d] of Object.entries(DOCS)) {
  test(`${d.file}: シリーズ標準の構成（前半と後半の見出しの順、Day の表記、言語の切り替え、プロジェクトのリンク）`, () => {
    const heads = h2(d.text);
    assert.ok(d.text.includes(d.switcher));
    assert.match(d.text, /\n# IC Learning Visualizer - .+\n/);
    assert.ok(d.text.includes(d.day));
    assert.ok(heads[0].startsWith('🌐'));
    assert.ok(heads[1].startsWith('📸'));
    assert.deepEqual(heads.slice(-4).map((h) => [...h][0]), ['📁', '💻', '📄', '🛠']);
    for (const icon of ['✨', '📖', '🎯', '🔒', '⚠', '🧪']) assert.ok(heads.some((h) => h.startsWith(icon)), icon);
    assert.match(section(d.text, d.sec.about), /https:\/\/akademeia\.info\/\?page_id=42163/);
    for (const b of ['stars', 'forks', 'last-commit', 'license']) assert.ok(d.text.includes(`img.shields.io/github/${b}/ipusiron/ic-learning-visualizer`), b);
    assert.doesNotMatch(d.text, /Web Worker|worker\.js|PERFORMANCE_IMPROVEMENTS/);
  });

  test(`${d.file}: 強調は1節に2か所まで、箇条書きの項目名を太字にしない`, () => {
    for (const h of h2(d.text)) {
      const n = (section(d.text, h).match(/\*\*[^*\n]+\*\*/g) || []).length;
      assert.ok(n <= 2, `${h}: ${n}`);
    }
    assert.doesNotMatch(d.text, /^\s*- \*\*/m);
  });

  test(`${d.file}: 区分の表とサンプルの表は実装の境界・結果と一致する`, () => {
    const sec = section(d.text, d.sec.bands);
    const bands = table(sec, d.heads.bands);
    assert.deepEqual(bands.map((r) => r[0]), ['flat', 'middle', 'language', 'skewed'].map((b) => d.msg[`band.${b}`]));
    assert.deepEqual(bands.map((r) => r[1]), [
      d.range[0](f3(BANDS.middle)), d.range[1](f3(BANDS.middle), f3(BANDS.language)),
      d.range[2](f3(BANDS.language), BANDS.skewed.toFixed(2)), d.range[3](BANDS.skewed.toFixed(2))
    ]);
    const rows = table(sec, d.heads.samples);
    assert.equal(rows.length, SAMPLE_ORDER.length);
    rows.forEach(([, n, ic, band], i) => {
      const a = analyzed(SAMPLE_ORDER[i]);
      assert.deepEqual([n, ic, band], [fmt(a.N), formatIC(a.ic), d.msg[`band.${a.band}`]], SAMPLE_ORDER[i]);
    });
  });

  test(`${d.file}: 鍵長とICの実験の表（決まった種・40個の鍵）と、鍵長推定の表は実装と一致する`, () => {
    const er = table(section(d.text, d.sec.experiment), d.heads.experiment);
    assert.ok(er.length >= 5);
    for (const [L, approx, measured] of er) {
      const row = exp.rows.find((x) => x.L === Number(L));
      assert.deepEqual([approx, measured], [formatIC(row.approx), formatIC(row.measured)], `L=${L}`);
    }
    const kr = table(section(d.text, d.sec.key), d.heads.key);
    assert.ok(kr.length >= 4);
    for (const [k, v] of kr) assert.equal(v, formatIC(icOf[Number(k)]), k);
  });

  test(`${d.file}: 文字数とばらつきの表（種1・1,000回）は lengthSpread と一致する`, () => {
    const rows = table(section(d.text, d.sec.spread), d.heads.spread);
    assert.equal(rows.length, 6);
    for (const [n, p5, p50, p95, language, middle] of rows) {
      const r = lengthSpread(corpusText, Number(n), SPREAD_TRIALS, xorshift32(SPREAD_SEED));
      const pct = (x) => (Number(n) < MIN_VERDICT ? '—' : `${(x * 100).toFixed(1)}%`);
      assert.deepEqual([p5, p50, p95, language, middle], [formatIC(r.p5), formatIC(r.p50), formatIC(r.p95), pct(r.shares.language),
        pct(r.shares.middle)], n);
    }
  });

  test(`${d.file}: 暗号の種類とICの比較の表（種20261004・鍵長5）は compareCiphers と一致する`, () => {
    const rows = table(section(d.text, d.sec.compare), d.heads.compare);
    const got = compareCiphers(plain, xorshift32(COMPARE_SEED), { vigenereLength: 5 });
    assert.equal(rows.length, got.length);
    rows.forEach(([name, ic, band, period], i) => {
      const r = got[i];
      const p = r.period === null ? d.msg['compare.none'] : r.period === 1 ? d.msg['compare.single'] : String(r.period);
      assert.deepEqual([name, ic, band, period], [d.msg[`compare.${r.id}`].replace('{L}', '5'), formatIC(r.ic),
        d.msg[`band.${classifyIC(r.ic, plain.length).band}`], p], r.id);
    });
  });

  test(`${d.file}: 言語ごとの IC の表は js/samples.js と一致する`, () => {
    const rows = table(section(d.text, d.sec.lang), d.heads.lang);
    assert.equal(rows.length, LANGUAGE_IC.length);
    rows.forEach(([name, fv, dv], i) => {
      const l = LANGUAGE_IC[i];
      assert.equal(name, d.msg[`lang.${l.id}`]);
      assert.equal(fv, `${l.friedman.toFixed(2)} → ${formatIC(l.friedman / 26)}`);
      assert.equal(dv, l.dcode === null ? '—' : formatIC(l.dcode));
    });
  });

  test(`${d.file}: 本文の数値（判定の下限・サンプル・鍵長・Σp²・ばらつき・URL）は実装と一致する`, () => {
    for (const c of d.claims) assert.ok(d.text.includes(c), c);
  });

  test(`${d.file}: ディレクトリー構造にすべてのファイルとディレクトリーが載り、全行に説明がある`, () => {
    const block = section(d.text, d.sec.tree).match(/```\n([\s\S]*?)```/)[1];
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
}

for (const [lang, file, sumLabel] of [['ja', 'about_ic.md', 'の合計は'], ['en', 'about_ic.en.md', 'over the letters is']]) {
  test(`${file} の計算例（英語のサンプル）と言語ごとの表は実装と一致する`, () => {
    const doc = read(file);
    const d = icDetail(english);
    assert.ok(doc.includes(`$N=${d.N}$`));
    assert.ok(doc.includes(`${sumLabel} ${fmt(d.pairs)}`));
    assert.ok(doc.includes(`$N(N-1) = ${d.N} \\times ${d.N - 1} = ${fmt(d.denom)}$`));
    assert.ok(doc.includes(`\\frac{${d.pairs}}{${d.denom}} \\approx ${formatIC(d.ic)}`));
    for (const l of LANGUAGE_IC) {
      const dc = l.dcode === null ? '—' : formatIC(l.dcode);
      assert.ok(doc.includes(`| ${MESSAGES[lang][`lang.${l.id}`]} | ${l.friedman.toFixed(2)} → ${formatIC(l.friedman / 26)} | ${dc} |`), l.id);
    }
    assert.doesNotMatch(doc, /231,900|0\.0775/);
    // 実測で直した主張（T と t を別の文字にする・約2倍・0.038〜0.05）が戻っていない
    assert.doesNotMatch(doc, /T と t（異なる）|約2倍|0\.038〜0\.05 付近/);
  });
}

// about_ic.md・about_ic.en.md に書いた実測の値は、同梱の英文で再現する（手順は impl/ref/day047/about_check2.mjs と同じ）
test('about_ic の実測の値（並べた2か所の一致・κ・2文字のIC・母音・ヴィジュネル）を同梱の英文で再現し、日英に同じ数が載る', () => {
  const corpus = read('corpus/eval-pg98.txt').replace(/[^A-Z]/g, '');
  const docs = [read('about_ic.md'), read('about_ic.en.md')];
  const has = (v) => docs.every((doc) => doc.includes(v));
  // 離れた2か所を並べたときの一致する割合
  const rate = (n) => {
    let m = 0;
    for (let i = 0; i < n; i++) if (corpus[i] === corpus[100000 + i]) m++;
    return m / n;
  };
  const rates = [100, 1000, 10000, 50000].map((n) => rate(n).toFixed(n < 10000 ? 3 : 4));
  assert.deepEqual(rates, ['0.100', '0.070', '0.0648', '0.0660']);
  for (const v of rates) assert.ok(has(v), v);
  // 例の2行（英字の大文字だけ）は37文字中4文字が一致
  const a = 'THEQUICKBROWNFOXJUMPSOVERTHELAZYDOGAN';
  const b = 'THERAININSPAINSTAYSMAINLYINTHEPLAINWH';
  assert.equal([...a].filter((ch, i) => ch === b[i]).length, 4);
  assert.ok(has(a) && has(b) && has('^^^  ^'));
  // 自分自身を1・2文字ずらして重ねると、英文でも一致する割合が低い
  const kp = (k) => {
    const t = corpus.slice(0, 10000);
    let m = 0;
    for (let i = 0; i + k < t.length; i++) if (t[i] === t[i + k]) m++;
    return m / (t.length - k);
  };
  const low = [kp(1).toFixed(3), kp(2).toFixed(3)];
  assert.deepEqual(low, ['0.038', '0.044']);
  for (const v of low) assert.ok(has(v), v);
  // 隣り合う2文字の IC の正規化値（×676）: 平文は約5.3、列転置（幅7）は約3.0。母音が2つ続く割合は約5〜6% → 約14〜15%
  const big = (t) => {
    const c = new Map();
    for (let i = 0; i + 1 < t.length; i++) c.set(t.slice(i, i + 2), (c.get(t.slice(i, i + 2)) || 0) + 1);
    let sum = 0;
    for (const n of c.values()) sum += n * (n - 1);
    return (sum / ((t.length - 1) * (t.length - 2))) * 676;
  };
  const vv = (t) => {
    let n = 0;
    for (let i = 0; i + 1 < t.length; i++) if ('AEIOU'.includes(t[i]) && 'AEIOU'.includes(t[i + 1])) n++;
    return n / (t.length - 1);
  };
  for (const start of [0, 50000, 100000, 150000]) {
    const p = corpus.slice(start, start + 20000);
    const rng = xorshift32(20261004 + start);
    const sub = substitution(p, rng).text;
    const col = columnar(p, 7, rng).text;
    assert.ok(big(p) > 4.9 && big(p) < 5.4 && Math.abs(big(sub) - big(p)) < 1e-9, `${start} plain ${big(p)}`);
    assert.ok(big(col) > 2.8 && big(col) < 3.1, `${start} columnar ${big(col)}`);
    assert.ok(vv(p) > 0.05 && vv(p) < 0.061 && vv(col) > 0.139 && vv(col) < 0.154, `${start} ${vv(p)} ${vv(col)}`);
  }
  // ヴィジュネル（英文2,000字・鍵40個の平均）: 鍵長2で約0.052、5で約0.044、20で約0.040
  const mean = (L) => {
    const rng = xorshift32(7 + L);
    let sum = 0;
    for (let i = 0; i < 40; i++) {
      const start = Math.floor(rng() * (corpus.length - 2000));
      sum += icDetail(encryptVigenere(corpus.slice(start, start + 2000), randomKey(L, rng))).ic;
    }
    return sum / 40;
  };
  assert.deepEqual([2, 5, 20].map((L) => mean(L).toFixed(3)), ['0.052', '0.044', '0.040']);
  for (const v of ['0.052', '0.044', '0.040', '21%', '38%', '98%']) assert.ok(has(v), v);
});

test('鍵長の当たり率の表（周期ごとのIC・κテスト・フリードマンの式）は、同じ試行で再現する（日英とも）', () => {
  const kappaFirst = (c) => {
    const curve = kappaCurve(c);
    const hit = curve.find((q) => q.rate >= KEY_IC_THRESHOLD);
    return hit ? hit.k : [...curve].sort((a, b) => b.rate - a.rate)[0].k;
  };
  const expected = [100, 200, 400, 1000].map((N) => {
    const rng = xorshift32(7 + N);
    const hit = { periodic: 0, kappa: 0, round: 0, within1: 0 };
    let trials = 0;
    for (let L = 3; L <= 10; L++) {
      for (let t = 0; t < 100; t++) {
        const k = randomKey(L, rng);
        const start = Math.floor(rng() * (corpusText.length - N));
        const c = encryptVigenere(corpusText.slice(start, start + N), k);
        const f = friedmanEstimate(c).estimate;
        trials++;
        if (keyLengthCandidates(c).candidates[0] === L) hit.periodic++;
        if (kappaFirst(c) === L) hit.kappa++;
        if (Math.round(f) === L) hit.round++;
        if (Math.abs(f - L) <= 1) hit.within1++;
      }
    }
    const pct = (n) => `${Math.round((n / trials) * 100)}%`;
    return [String(N), pct(hit.periodic), pct(hit.kappa), pct(hit.round), pct(hit.within1)];
  });
  for (const d of Object.values(DOCS)) assert.deepEqual(table(section(d.text, d.sec.inside), d.heads.accuracy), expected, d.file);
});

test('画像: 参照はすべて実在し、日本語版は assets/、英語版は assets/en/ の画像を使う。参照していない PNG は置かない', () => {
  const refs = {};
  for (const [lang, d] of Object.entries(DOCS)) {
    refs[lang] = [...d.text.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map((m) => m[1]);
    assert.equal(refs[lang].length, 7, lang);
    for (const r of refs[lang]) {
      assert.ok(fs.existsSync(path.join(ROOT, r)), r);
      assert.match(r, d.images, r);
      assert.ok(fs.statSync(path.join(ROOT, r)).size <= 300 * 1024, r);
    }
  }
  const pngs = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.png')).map((f) => `${dir}/${f}`).sort();
  assert.deepEqual(pngs('assets'), [...new Set(refs.ja)].sort());
  assert.deepEqual(pngs('assets/en'), [...new Set(refs.en)].sort());
});

test('ユースケースの「このツールならではの使い方」の値は計算部と同じ（日英）', () => {
  const [ja, en] = [read('README.md'), read('README.en.md')];
  const birds = icDetail('A'.repeat(10) + 'B'.repeat(5) + 'C'.repeat(3) + 'D'.repeat(2));
  const even = icDetail('ABCDE'.repeat(4));
  assert.deepEqual([birds.N, formatIC(birds.ic), (1 - birds.ic).toFixed(3), (1 - even.ic).toFixed(3)], [20, '0.3105', '0.689', '0.842']);
  assert.equal(classifyIC(birds.ic, birds.N).band, 'tooShort');
  assert.equal(MESSAGES.ja['band.tooShort'], '判定しない');
  for (const part of ['ICは0.3105', '引いた0.689', '0.842と大きく']) assert.ok(ja.includes(part), part);
  for (const part of ['IC of 0.3105', 'the IC, 0.689', 'larger 0.842']) assert.ok(en.includes(part), part);
  const hhi = expectedRate('AAAABBBCCD', true);
  const flat = expectedRate('ABCDEFGHIJ', true);
  assert.deepEqual([formatIC(hhi), fmt(Math.round(hhi * 10000)), formatIC(flat), fmt(Math.round(flat * 10000))],
    ['0.3000', '3,000', '0.1000', '1,000']);
  assert.ok(ja.includes('理論値（Σp²）は0.3000') && ja.includes('3,000で、10社が均等なら0.1000（1,000）'));
  assert.ok(en.includes('(Σp²) is 0.3000') && en.includes('it is 3,000, and ten equal companies bring it down to 0.1000 (1,000)'));
  assert.equal(MESSAGES.ja['ui.replacement'], '同じ位置も選ぶ（復元抽出）');
  const az = formatIC(expectedRate('ABCDEFGHIJKLMNOPQRSTUVWXYZ', true));
  const eng = formatIC(expectedRate(normalizeText(SAMPLES.english).text, true));
  assert.deepEqual([az, eng], ['0.0385', '0.0671']);
  assert.ok(ja.includes(`理論値${az}（1/26）`) && ja.includes(`英語のサンプルでは${eng}`));
  assert.ok(en.includes(`expected value ${az} (1/26)`) && en.includes(`English sample it is ${eng}`));
});
