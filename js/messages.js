// 画面に出す文言（JS が組み立てるもの）。ロジックはキーと値を返し、ここで文にする

const JA = {
  'theme.toDark': 'ダークモードに切り替える',
  'theme.toLight': 'ライトモードに切り替える',

  'step.patternTitle1': 'すべて違う文字',
  'step.patternTitle2': '同じ文字が1組',
  'step.patternTitle3': '5文字が2回ずつ',
  'step.patternTitle4': '偏った分布',
  'step.patternDesc1': '同じ文字がないので、一致する組は0',
  'step.patternDesc2': 'Aの2個だけが一致する（2組）',
  'step.patternDesc3': '5種類が均等に出る（10組）',
  'step.patternDesc4': 'Aが6個と多い（32組）',
  'step.ic': 'IC = {ic}',
  'step.random': '🎲 ランダム（26文字が均等）',
  'step.randomDesc': '1/26 に近づく',
  'step.english': '🇬🇧 英語',
  'step.englishDesc': 'E・T・A などが多く出る（dCode の値）',
  'step.vigenere': '🔐 ヴィジュネル暗号（鍵長5のサンプル）',
  'step.vigenereDesc': '鍵で文字がばらけ、1/26 に近づく',
  'step.minChars': '2文字以上の英字を入れてください',
  'step.tooLong': '30文字までにしてください',
  'step.ignored': '英字以外の {n} 文字は数えていません',
  'quiz.choose': '答えを選んでください',
  'quiz.correct1': '正解です。AAAAAA はどの2文字を選んでも同じ文字なので IC＝1。ABABAB は {c}、ABCDEF は0です。',
  'quiz.wrong1': 'もう一度考えてみましょう（IC: ABCDEF＝0、AAAAAA＝1、ABABAB＝{c}）。',
  'quiz.correct2': '正解です。文字の出現頻度に偏りがあるほど、同じ文字を選ぶ確率が上がります。',
  'quiz.wrong2': 'もう一度考えてみましょう。すべての文字が均等なら IC は1/26（約0.0385）です。',

  'sample.english': 'Pangram を含む英文です。',
  'sample.random': '一様乱数で作った300字です（毎回同じ文字列）。',
  'sample.caesar': '英文を3文字ずらしたシーザー暗号です。IC は平文と同じです。',
  'sample.vigenere': '英文を鍵 {key} で暗号化したヴィジュネル暗号です。応用タブの鍵長推定でも使えます。',
  'sample.german': 'ドイツ語の文です。ü・ä・ö はアクセント記号を外して U・A・O として数えます。',
  'sample.french': 'フランス語の文です。é・è・ç などはアクセント記号を外して数えます。',
  'sample.repeated': 'A〜E を6個ずつ並べて繰り返した人工的な文です。',
  'sample.custom': '自分の文を入れて「分析する」を押してください。',

  'analyze.empty': 'テキストを入れてください',
  'analyze.tooLong': 'テキストが長すぎます（{n} 字。上限は {max} 字）',
  'analyze.tooFew': '数える文字が2文字未満です（A〜Zだけを数えるときは英字を入れてください）',
  'analyze.done': '{n} 文字を数えました（数えなかった文字 {ignored}）',
  'analyze.other': 'A〜Z 以外の文字 {n} 個は、棒グラフの外で数えています',
  'analyze.barTitle': '{ch}: {n}回',
  'band.tooShort': '判定しない',
  'band.flat': '平坦',
  'band.middle': '中間',
  'band.language': '言語らしい',
  'band.skewed': '偏りが大きい',
  'band.tooShortDesc': '{n} 字では短すぎて判定できません（{min} 字以上で判定します）。',
  'band.flatDesc': '1/26（約0.0385）に近い値です。鍵の長い多表式暗号（ヴィジュネル暗号など）や、ランダムな文字列で見られます。応用タブの鍵長推定で、周期ごとのICを見てみてください。',
  'band.middleDesc': '英語（約0.067）と1/26の中間の値です。鍵の短い（2〜3文字の）多表式暗号や、平文と暗号文が混ざった文で見られます。',
  'band.languageDesc': '自然言語の範囲の値です。平文のほか、シーザー暗号などの単一換字式暗号や転置式暗号も、文字の出現回数が平文と同じなので、この値になります。',
  'band.skewedDesc': '自然言語より大きな値です。同じ文字の繰り返しなど、人工的な文で見られます。',
  'band.shortNote': '{n} 字の短い文です。200字未満では英文でもICがばらつくので、区分が外れることがあります。',

  'monte.sourceCurrent': 'サンプル分析タブのテキスト',
  'monte.previewEmpty': '（テキストがありません）',
  'monte.previewMore': '…（ほか {n} 字）',
  'monte.needCustom': '自分の文を入れてください',
  'monte.tooShort': 'A〜Z が2文字以上のテキストを選んでください',
  'monte.badTrials': '試行回数は {min}〜{max} の整数で入れてください',
  'monte.running': '実験中です（{done} / {total} 回）',
  'monte.done': '{total} 回の試行が終わりました。実験の値 {exp}、理論値 {ic}（差 {diff}。この回数でのばらつきの目安は ±{se2}）',
  'monte.stopped': '{done} 回で止めました',
  'monte.position': '{n} 文字目',
  'monte.yes': '一致',
  'monte.no': '不一致',
  'monte.axisY': '実験の値',
  'monte.axisX': '試行回数',
  'monte.theory': '理論値 {ic}',

  'key.empty': '暗号文を入れてください',
  'key.tooShort': '英字が {n} 字しかありません（{min} 字以上必要です）',
  'key.tooLong': '暗号文が長すぎます（{n} 字。上限は {max} 字）',
  'key.found': '鍵長の候補は {list} です。列の平均ICが {th} 以上になった周期を、小さい順に並べています（倍数は同じように高くなります）。',
  'key.notFound': '列の平均ICが {th} 以上になる周期は、20までにありませんでした。暗号文が短いか、ヴィジュネル暗号ではない可能性があります。',
  'key.whole': '周期に分けない全体のICは {ic} です。',
  'key.wholeHigh': '周期に分けない全体のICが {ic} と言語の値に近いので、平文か、単一換字式暗号（シーザー暗号など）・転置式暗号の可能性があります。',
  'key.hit': '以上',
  'key.miss': '—',
  'key.listJoin': '・',

  'lang.english': '英語',
  'lang.french': 'フランス語',
  'lang.german': 'ドイツ語',
  'lang.italian': 'イタリア語',
  'lang.spanish': 'スペイン語',
  'lang.portuguese': 'ポルトガル語',
  'lang.none': '—'
};

let current = JA;

export function t(key, vars = {}) {
  const s = current[key];
  if (s === undefined) return key;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export const MESSAGES = { ja: JA };
