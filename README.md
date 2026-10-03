<!--
---
id: day047
slug: ic-learning-visualizer

title: "IC Learning Visualizer"

subtitle_ja: "一致指数をビジュアル理解するツール"
subtitle_en: "Visual learning tool for Index of Coincidence"

description_ja: "一致指数（IC）を、計算の内訳・サンプルの比較・モンテカルロ実験・周期ごとのICによる鍵長推定で段階的に理解するための教育ツール"
description_en: "An educational tool to understand the Index of Coincidence (IC) step by step through the calculation, sample comparison, Monte Carlo experiments and key length estimation by periodic IC"

category_ja:
  - 古典暗号
  - 暗号解析
category_en:
  - Classical Cryptography
  - Cryptanalysis

difficulty: 3

tags:
  - cryptography
  - index-of-coincidence
  - vigenere
  - friedman-test
  - monte-carlo
  - visualization
  - statistics
  - education

repo_url: "https://github.com/ipusiron/ic-learning-visualizer"
demo_url: "https://ipusiron.github.io/ic-learning-visualizer/"

hub: true
---
-->

# IC Learning Visualizer - 一致指数をビジュアル理解するツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/ic-learning-visualizer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/ic-learning-visualizer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/ic-learning-visualizer)
![GitHub license](https://img.shields.io/github/license/ipusiron/ic-learning-visualizer)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/ic-learning-visualizer/)

**Day047 - 生成AIで作るセキュリティツール100**

一致指数（Index of Coincidence：IC）は、テキストから2文字を（同じ位置を選ばずに）ランダムに選んだとき、それらが同じ文字である確率です。暗号解読に役立つ一方で、定義は初学者にはわかりにくいといえます。本ツールは、計算の内訳、サンプルの比較、モンテカルロ実験、周期ごとのICによる鍵長推定を通じて、ICを段階的に理解するための教育ツールです。入力はブラウザーの中だけで扱い、外部へは送りません。

---

## 🌐 デモページ

👉 **[https://ipusiron.github.io/ic-learning-visualizer/](https://ipusiron.github.io/ic-learning-visualizer/)**

ブラウザーで直接お試しいただけます。

---

## 📸 スクリーンショット

>![サンプル分析（ヴィジュネル暗号）](assets/screenshot.png)
>
>*ヴィジュネル暗号のサンプルを分析したところ。ICは0.0432で、区分は「平坦」*

>![モンテカルロ実験](assets/screenshot2.png)
>
>*英語のサンプルから2文字を20,000回選び、一致した割合が理論値（IC）に近づく様子*

>![鍵長推定](assets/screenshot3.png)
>
>*周期ごとのICで鍵長を推定したところ。しきい値以上の最小の周期5が1位*

>![文字の分布とIC（ダークモード）](assets/screenshot4.png)
>
>*ステップ学習の3: 同じ文字が増えるほどICが大きくなる例（ダークモード）*

---

## 📛 ツール名の由来・意味

- IC: Index of Coincidence（一致指数）。古典暗号の解読で鍵長推定などに使われる統計量
- Learning: 計算器ではなく、教育・学習のための教材であることを示す
- Visualizer: 数値や式だけでなく、ヒストグラムやモンテカルロ実験を通じて「見て理解できる」ツールであることを表す

つまり「IC Learning Visualizer」とは、「一致指数を学習用に可視化し、理解を深めるためのツール」を意味します。

---

## ✨ 機能

### 📚 ステップ学習タブ

- ICとは何か（HELLOの例で、選び方の数と同じ文字になる数を数える）
- 計算の内訳: 入力した英字の出現回数、組の数n(n−1)、分子と分母、IC
- 文字の分布とIC: 10文字の4つの例のICを、その場で計算して並べる
- 言語と暗号文のIC: ランダム（1/26）・英語・ヴィジュネル暗号のサンプルを棒で比べる
- 理解度チェックのクイズ

### 📊 サンプル分析タブ

- サンプル7種（英語・ランダム・シーザー暗号・ヴィジュネル暗号・ドイツ語・フランス語・繰り返し）と自分の文
- A〜Zの出現回数の棒グラフ、文字数、IC、区分（平坦・中間・言語らしい・偏りが大きい）
- A〜Zだけを数えるとき、全角英字は半角に、アクセント記号は外して基底の字に（Ü→U、é→E、ß→SS）
- A〜Zだけを数えないときは、数えた文字すべてで出現回数とICを計算する

### 🎲 モンテカルロ実験タブ

- テキストから2文字を（同じ位置を選ばずに）選ぶ試行を繰り返し、一致した割合がICに近づく様子を見る
- 対象: サンプル分析タブのテキスト、英語・ランダム・ヴィジュネル暗号のサンプル、自分の文
- 速さ3段階（1回ずつ見る・ふつう・すぐに結果）。どの速さでも収束グラフに約100点を描く
- 直近の試行で選んだ2つの位置を、前後の文字といっしょに表示する
- 終わったら、実験の値と理論値の差と、その回数でのばらつきの目安（標準誤差の2倍）を示す

### 🔐 応用・暗号解析タブ

- 言語ごとのIC（出典2つの値を並べる）
- 暗号の種類とIC（単一換字・多表式・転置）
- ヴィジュネル暗号の鍵長推定（周期ごとのIC）。サンプルの暗号文を入れるボタンつき
- 関連ツールへのリンク（Day009・Day028・Day030・Day044・Day046）

### 🖥️ 画面

- ライト／ダークモード（OSの設定に従い、ボタンでも切り替え）
- キーボードで操作できるタブ（左右の矢印・Home・End）、ヘルプはEscで閉じる
- 幅320pxのスマートフォンでも横にはみ出さない

---

## 📖 使い方

1. 公開版（[https://ipusiron.github.io/ic-learning-visualizer/](https://ipusiron.github.io/ic-learning-visualizer/)）を開く
2. 「ステップ学習」タブで、ICの定義と計算を順に確かめる
3. 「サンプル分析」タブで、サンプルのICと区分を見比べる。自分の文も分析できる
4. 「モンテカルロ実験」タブで、実験の値が理論値に近づく様子を見る
5. 「応用・暗号解析」タブで、ヴィジュネル暗号の暗号文から鍵長を推定する

手元で動かすときは、フォルダーで`python -m http.server 8000`などを実行し、`http://localhost:8000/`で開きます。

---

## 🔬 一致指数（IC）とは

文字ごとの出現回数をn_i、総文字数をNとすると、ICは次の式で求めます。

$$IC = \frac{\sum_i n_i (n_i - 1)}{N (N - 1)}$$

- 分母N(N−1)は、2文字を順序つきで選ぶ方法の数。分子は、同じ文字の組を順序つきで選ぶ方法の数
- 26文字が均等に出る長い文では、ICは1/26（約0.0385）に近づく
- 英語の文では、E・T・Aなどが多く出るので約0.066になる
- 単一換字式暗号（シーザー暗号など）や転置式暗号は、文字の出現回数の組み合わせが平文と同じなので、ICも平文と同じになる
- 多表式暗号（ヴィジュネル暗号など）は、鍵長が長いほど1/26に近づく

数学的な詳細は[about_ic.md](about_ic.md)にまとめています。

---

## 📊 区分の基準とサンプル

サンプル分析タブでは、ICを次の4つに分けます。50字未満は判定せず、200字未満の短い文には「外れることがある」と添えます。

| 区分 | ICの範囲 | 見られる文 |
|---|---|---|
| 平坦 | 0.046未満 | 鍵の長い多表式暗号、ランダムな文字列 |
| 中間 | 0.046〜0.058 | 鍵の短い（2〜3文字の）多表式暗号、平文と暗号文が混ざった文 |
| 言語らしい | 0.058〜0.10 | 平文、単一換字式暗号、転置式暗号 |
| 偏りが大きい | 0.10以上 | 同じ文字の繰り返しなど、人工的な文 |

サンプル（A〜Zだけを数える）の値は次のとおりです。

| サンプル | 文字数 | IC | 区分 |
|---|---|---|---|
| 英語の文章 | 475 | 0.0651 | 言語らしい |
| ランダム | 300 | 0.0388 | 平坦 |
| シーザー暗号 | 334 | 0.0691 | 言語らしい |
| ヴィジュネル暗号 | 356 | 0.0432 | 平坦 |
| ドイツ語 | 449 | 0.0768 | 言語らしい |
| フランス語 | 434 | 0.0842 | 言語らしい |
| 繰り返し | 300 | 0.1973 | 偏りが大きい |

- ランダムのサンプルは、決まった種の乱数で作った一様な300字（いつも同じ文字列）
- シーザー暗号のサンプルは英文を3文字ずらしたもの、ヴィジュネル暗号のサンプルは英文を鍵LEMONで暗号化したもの
- ドイツ語・フランス語は、アクセント記号を外して数えている

---

## 🔑 鍵長推定の仕組み

暗号文を周期Lで列に分け（1, L+1, 2L+1, …文字目が列1）、列ごとのICを平均します。周期が鍵長なら、各列は同じずらしのシーザー暗号なので、ICが言語の値に戻ります。鍵長の倍数でも同じように高くなり、列が短いほど値が揺れるので、ICの大きい順に並べるだけだと倍数が1位に来やすくなります。そこで、列の平均ICが0.058以上になった周期を小さい順に先に並べ、残りを平均の大きい順に続けます。

ヴィジュネル暗号のサンプル（鍵LEMON）では、次のようになります。

| 周期 | 列の平均IC |
|---|---|
| 2 | 0.0431 |
| 3 | 0.0434 |
| 5 | 0.0706 |
| 10 | 0.0720 |
| 15 | 0.0669 |
| 20 | 0.0694 |

- 0.058以上になる周期は5・10・15・20で、候補の1位は5（鍵LEMONの長さ）
- ICの大きい順に並べるだけだと、周期10（0.0720）が周期5（0.0706）より上に来る
- 周期に分けない全体のICは0.0432。全体のICが0.058以上なら、平文か単一換字式暗号・転置式暗号の可能性があると画面で知らせる

---

## 🎲 モンテカルロ実験の仕組み

- 1回の試行では、位置を2つ、同じ位置にならないように一様に選ぶ（ICの定義どおり）。一致した割合の期待値はICに等しい
- n回の試行の割合のばらつきの目安は、標準誤差 √(IC×(1−IC)/n) の2倍。英語のサンプル（IC 0.0651）なら、1,000回で約±0.016、20,000回で約±0.0035
- 乱数はMath.randomを使う（学習用の実験で、暗号の用途ではない）
- 計算はメインスレッドで小分けに行う。このマシンのNode.js 22では、10万字のICが約0.4ms、周期20までの列のICが約8ms、10万回の試行が約3msだった

---

## 📊 言語ごとのIC

言語ごとの値は、数える文章によって変わるので、出典によって少しずつ違います。応用・暗号解析タブでは、次の2つの出典の値を並べています。

| 言語 | Friedman & Callimahos（正規化値 → IC） | dCode |
|---|---|---|
| 英語 | 1.73 → 0.0665 | 0.0667 |
| フランス語 | 2.02 → 0.0777 | 0.0778 |
| ドイツ語 | 2.05 → 0.0788 | 0.0762 |
| イタリア語 | 1.94 → 0.0746 | 0.0738 |
| スペイン語 | 1.94 → 0.0746 | 0.0770 |
| ポルトガル語 | 1.94 → 0.0746 | — |

- 正規化値はIC×26（26文字が均等なら1.00）
- 出典: W. F. Friedman・L. D. Callimahos『Military Cryptanalytics, Part I』（[Wikipedia「Index of coincidence」](https://en.wikipedia.org/wiki/Index_of_coincidence)の表）、[dCode「Index of Coincidence」](https://www.dcode.fr/index-coincidence)

---

## 🎯 ユースケース

- 暗号の授業: 平文・シーザー暗号・ヴィジュネル暗号のサンプルを並べ、単一換字ではICが変わらず、多表式では1/26に近づくことを数値で示す
- 確率・統計の授業: 「2文字を選んで一致する確率」をモンテカルロ実験で確かめ、試行回数を増やすと理論値に近づくこと（大数の法則）と、ばらつきの目安（標準誤差）を体感する
- CTFの古典暗号の問題: 暗号文のICで単一換字か多表式かの見当を付け、周期ごとのICで鍵長を推定する。鍵長がわかったら、[Modular Text Divider（Day030）](https://ipusiron.github.io/modular-text-divider/)で列に分け、[AlphaLoom（Day046）](https://ipusiron.github.io/alphaloom/)で鍵の英単語を探す
- 謎解き・暗号パズルの制作: 作った暗号文のICを見て、頻度分析で解けてしまうか（言語らしいか）を確かめる
- 言語の比較: ドイツ語・フランス語のサンプルや自分で用意した文で、言語ごとにICが違うことを確かめる（短い文ではばらつく点も含めて）
- 文字の偏りを測る道具として: 文章の文字の偏り（同じ文字の多さ）を1つの数値で比べる。人工的な繰り返しの多い文はICが大きくなる
- 自習: ステップ学習で定義と計算を確かめ、クイズで理解を確認する

---

## 🔒 セキュリティとプライバシー

- 入力した文は、ブラウザーの中だけで扱う。サーバーへの送信や保存はしない
- Content Security Policy（meta）で、スクリプト・スタイル・通信先を同じサイトに限る。インラインのスクリプト・イベントハンドラー・style属性は使わない
- 入力した文字や結果は、すべて`textContent`で画面に入れる（HTMLとして解釈しない）
- 入力は10万字まで
- localStorageには、テーマの選択だけを保存する（保存できない環境でも動く）

---

## ⚠️ 注意と限界

- ICは、文字の出現回数だけから決まる。区分は暗号の種類の見当を付けるための目安で、暗号の種類を言い当てるものではない
- 短い文では、平文でもICが大きくばらつく。50字未満は判定せず、200字未満では区分が外れることがある
- 単一換字式暗号と転置式暗号は、どちらもICが平文と同じなので、ICだけでは区別できない（文字の頻度やn-gramを調べる）
- 鍵長推定は、周期20まで、英字20字以上の暗号文が対象。鍵が長いほど、また暗号文が短いほど外れやすい
- 言語ごとのICは出典の値で、数える文章によって変わる
- ファイルとして直接開く（file://）と、ChromeやEdgeではツールが起動しない（ES modulesを読み込めないため）。画面に案内が出るので、上の「使い方」の手順でHTTPから開く

---

## 🧪 テスト

ロジック（`js/ic-core.js`・`js/samples.js`）はDOMに依存しないモジュールにしてあり、Node.jsの標準のテスト（`node:test`）で検証します。依存パッケージはありません。

```bash
npm test
```

- Node.js 22以上
- GitHub Actionsで、pushとプルリクエストのたびに自動で実行する
- ICの既知解答（HELLO＝0.1000など）、正規化、周期ごとのIC、鍵長の候補、区分、モンテカルロの収束（標準誤差の4倍以内）、ヴィジュネル暗号の既知解答（ATTACKATDAWNを鍵LEMONでLXFOPVEFRNHR）を検証する
- サンプルの性質（ヴィジュネル暗号のサンプルは1つのずらしでは戻らない、ランダムのICは1/26に近い）と、このREADMEの表・数値もテストで検証する
- index.htmlのCSP・ラベル・タブの役割、配色のコントラスト（ライト・ダークとも4.5:1以上）も検証する

---

## 📁 ディレクトリー構造

```
ic-learning-visualizer/
├── .github/                # GitHubの設定
│   └── workflows/          # GitHub Actionsのワークフロー
│       └── test.yml        # pushとプルリクエストでnpm testを実行
├── assets/                 # 画像
│   ├── favicon.svg         # ファビコン
│   ├── screenshot.png      # スクリーンショット（サンプル分析）
│   ├── screenshot2.png     # スクリーンショット（モンテカルロ実験）
│   ├── screenshot3.png     # スクリーンショット（鍵長推定）
│   └── screenshot4.png     # スクリーンショット（ステップ学習・ダーク）
├── js/                     # 画面以外のモジュール
│   ├── chart.js            # 収束グラフの描画（canvas）
│   ├── file-check.js       # file://で起動できなかったときの案内
│   ├── ic-core.js          # ICの計算（正規化・IC・周期ごとのIC・鍵長の候補・区分・モンテカルロ・鍵長とICの実験）
│   ├── links.js            # 暗号文を渡してほかのツールで続けるリンク
│   ├── messages.js         # 画面に出す文言
│   ├── params.js           # URLの?text=・?tab=を受け取る
│   ├── samples.js          # サンプル・ステップの例・言語ごとのICの表
│   ├── tabs.js             # タブの切り替え（キーボード操作を含む）
│   ├── theme-init.js       # 読み込みの最初にテーマを当てる
│   └── theme.js            # ライト／ダークの切り替え
├── test/                   # テスト（node:test）
│   ├── contrast.test.js    # 配色のコントラスト・入力欄と操作の大きさ
│   ├── core.test.js        # ICの計算・正規化・鍵長・区分・モンテカルロ・既知解答
│   ├── experiment.test.js  # 鍵長とICの実験・近似式・ばらつきの帯
│   ├── format.test.js      # 行の長さ・制御文字・行数の下限
│   ├── html.test.js        # CSP・要素のid・タブの役割・ラベル
│   ├── links.test.js       # ほかのツールへのリンク・URLの受け取り
│   ├── messages.test.js    # 文言の置き場所とキー
│   ├── readme.test.js      # READMEの表・構成・ツリー・画像
│   └── samples.test.js     # サンプルの性質・ステップの例・クイズの正解
├── .gitignore              # Gitの除外設定
├── .nojekyll               # GitHub PagesでJekyllを使わない指定
├── CLAUDE.md               # Claude Code向けの開発メモ
├── LICENSE                 # ライセンス（MIT）
├── README.md               # 本ドキュメント
├── about_ic.md             # ICの数学的な詳細
├── index.html              # 画面
├── package.json            # npm testの設定（依存なし）
├── script.js               # 画面の処理（ES module）
└── style.css               # スタイル（ライト・ダーク）
```

---

## 💻 動作環境

- Chrome・Edge・Firefoxの最新版で動作を確認している（Safariは未確認）
- 公開版（[https://ipusiron.github.io/ic-learning-visualizer/](https://ipusiron.github.io/ic-learning-visualizer/)）をそのまま使える
- 手元で動かすときは、フォルダーで`python -m http.server 8000`などを実行し、`http://localhost:8000/`で開く

---

## 📄 ライセンス

- ソースコードのライセンスは`LICENSE`ファイルを参照してください。

---

## 🛠️ このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
