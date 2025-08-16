
<!--
---
title: IC Learning Visualizer
category: classic-crypto
difficulty: 1
description: An educational tool to intuitively understand the Index of Coincidence (IC) through histograms and probability experiments.
tags: [cryptography, classic, statistics, visualization, education]
demo: https://ipusiron.github.io/ic-learning-visualizer/
---
-->

# IC Learning Visualizer - 一致指数をビジュアル理解するツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/ic-learning-visualizer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/ic-learning-visualizer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/ic-learning-visualizer)
![GitHub license](https://img.shields.io/github/license/ipusiron/ic-learning-visualizer)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/ic-learning-visualizer/)

**Day047 - 生成AIで作るセキュリティツール100**

**一致指数（Index of Coincidence：IC）** とは、あるテキストからランダムに2文字を選んだとき、それらが同じ文字である確率を表す統計量です。

ICの概念は暗号解読に役立ちます。
しかしながら、定義は初学者にとってわかりにくいといえます。

本ツールは、**頻度ヒストグラム** と **確率実験** を用いることでICを直感的に理解することをゴールとした教育ツールです。

---

## 📛 ツール名の由来・意味
- **IC**: Index of Coincidence（一致指数）。古典暗号解読で鍵長推定などに使われる統計量。
- **Learning**: 単なる計算器ではなく、教育・学習目的で **IC の直感的理解を助ける教材** であることを示す。
- **Visualizer**: 数値や式だけでなく、**ヒストグラムやモンテカルロ実験を通じて「見て理解できる」** ツールであることを表現。  

つまり「IC Learning Visualizer」とは、**「一致指数を学習用に可視化し、理解を深めるためのツール」** を意味します。  

---

## 🌐 デモページ

👉 **[https://ipusiron.github.io/ic-learning-visualizer/](https://ipusiron.github.io/ic-learning-visualizer/)**

ブラウザーで直接お試しいただけます。

---

## 📸 スクリーンショット

> ![ダミー](assets/screenshot.png)  
>
> *ダミー*

---

## ✨ 機能
- A–Z 頻度ヒストグラム
- 数式の内訳（Σ nᵢ(nᵢ−1)、N(N−1)、Σ pᵢ²）を数値表示
- モンテカルロで **「ランダムに2文字を抜く→一致確率」** を近似
- 参考値表示：等分布 `1/26 ≈ 0.0385`、英語平文 `≈0.066–0.068`

### ⚙️ 前処理オプション
- **A–Z のみ**（大文字化・非英字除去）
- **空白/記号の除去**

### 🧪 サンプル
- 英語風テキスト
- ランダム英字（500文字）

---

## 🚀 使い方
1. `index.html` をブラウザで開く  
2. テキストを貼り付け、「ICを計算」をクリック  
3. 頻度ヒストグラムと IC 値、数式の内訳が表示  
4. モンテカルロで収束挙動を確認  


---

## 📖 一致指数（IC）とは

**一致指数（Index of Coincidence; IC）** とは、あるテキストからランダムに2文字を選んだとき、それらが同じ文字である確率を表す統計量です。

文字ごとの出現回数を \( n_i \)、総文字数を \( N \) とすると、次式で定義されます。

\[
IC = \frac{\sum_i n_i (n_i - 1)}{N (N - 1)}
\]

- **等分布の英字ランダム文字列**では IC はおよそ **1/26 ≈ 0.0385**。  
- **実際の英語平文**では文字の偏り（E が多いなど）があるため、IC は **0.066–0.068** 程度になります。  
- この差を利用して、ヴィジュネル暗号などの **鍵長推定や暗号文解析**に応用されます。

---

## 📁 ディレクトリ構造

```
```

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) をご覧ください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。  
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを  
100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
