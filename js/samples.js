// 分析とモンテカルロ実験のサンプル。暗号文と乱数の文字列は、平文・鍵・種からここで作る（手で書き写さない）

import { ALPHABET, encryptVigenere, shiftLetters, xorshift32 } from './ic-core.js';

export const ENGLISH = 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. '
  + 'In cryptanalysis, the Index of Coincidence is a statistical measure used to determine the likelihood that two randomly selected '
  + 'characters from a text are the same. English text typically has an IC value around 0.067, which reflects the natural frequency '
  + 'distribution of letters in the language. Common letters like E, T, A, O, I, N appear much more frequently than rare letters like '
  + 'Q, X, Z, making the probability of selecting matching characters higher than in truly random text.';

export const CAESAR_SHIFT = 3;
export const CAESAR_PLAIN = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. THIS IS AN EXAMPLE OF A CAESAR CIPHER WITH A SHIFT OF THREE '
  + 'POSITIONS. IN THIS ENCRYPTION METHOD, EACH LETTER IN THE PLAINTEXT IS REPLACED BY THE LETTER THREE POSITIONS LATER IN THE '
  + 'ALPHABET. SINCE THIS IS A SIMPLE SUBSTITUTION CIPHER, THE FREQUENCY DISTRIBUTION OF LETTERS REMAINS THE SAME AS THE ORIGINAL '
  + 'TEXT, RESULTING IN AN IC VALUE SIMILAR TO NATURAL LANGUAGE.';

export const VIGENERE_KEY = 'LEMON';
export const VIGENERE_PLAIN = 'The Vigenere cipher shifts each letter of the message by a different amount. The amounts come from a keyword '
  + 'that repeats along the whole text. Because one plaintext letter can turn into several different ciphertext letters, the letter '
  + 'frequencies become flatter, and the index of coincidence falls toward the value of random text. Splitting the ciphertext into '
  + 'columns by the key length brings the value of natural language back.';

export const RANDOM_SEED = 20261003;
export const RANDOM_LENGTH = 300;

// 一様乱数の英字（決まった種で作るので、いつも同じ文字列になる）
export function randomLetters(seed = RANDOM_SEED, length = RANDOM_LENGTH) {
  const rng = xorshift32(seed);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(rng() * 26)];
  return out;
}

export const GERMAN = 'Der schnelle braune Fuchs springt über den faulen Hund. Dies ist ein Beispiel für deutschen Text. Die deutsche Sprache '
  + 'hat ihre eigene charakteristische Buchstabenverteilung, die sich von anderen europäischen Sprachen unterscheidet. Häufige '
  + 'Buchstaben wie E, N, I, S, R, A treten öfter auf als seltene Buchstaben wie Q, X, Y. Der Index of Coincidence für deutschen '
  + 'Text liegt je nach Quelle bei etwa 0,076 bis 0,079, was etwas höher ist als bei englischen Texten. Dies spiegelt die '
  + 'spezifischen Eigenschaften der deutschen Orthographie und Wortbildung wider.';

export const FRENCH = 'Le renard brun et rapide saute par-dessus le chien paresseux. Ceci est un exemple de texte français. La langue '
  + 'française possède sa propre distribution caractéristique des lettres, influencée par la phonétique et l\'orthographe '
  + 'française. Les lettres fréquentes comme E, A, I, S, N, T, R apparaissent plus souvent que les lettres rares comme W, K, Z. '
  + 'L\'Index de Coïncidence pour le français se situe généralement autour de 0,078, reflétant les particularités de cette langue '
  + 'romane avec ses voyelles accentuées et ses consonnes spécifiques.';

export const REPEATED = 'AAAAAABBBBBBCCCCCCDDDDDDEEEEEE'.repeat(10);

export const SAMPLES = {
  english: ENGLISH,
  random: randomLetters(),
  caesar: shiftLetters(CAESAR_PLAIN, CAESAR_SHIFT),
  vigenere: encryptVigenere(VIGENERE_PLAIN, VIGENERE_KEY),
  german: GERMAN,
  french: FRENCH,
  repeated: REPEATED
};

export const SAMPLE_ORDER = ['english', 'random', 'caesar', 'vigenere', 'german', 'french', 'repeated'];

// ステップ3の例（IC は画面でロジックから計算する）
export const STEP3_PATTERNS = ['ABCDEFGHIJ', 'AABCDEFGHI', 'AABBCCDDEE', 'AAAAAABBCD'];

// クイズ（正解の選択肢は IC をロジックで計算して確かめる。test/samples.test.js）
export const QUIZ1_OPTIONS = { a: 'ABCDEF', b: 'AAAAAA', c: 'ABABAB' };

// 言語別の IC（出典の値）。friedman＝Friedman & Callimahos『Military Cryptanalytics』の正規化値（×1/26 で IC）、
// dcode＝dCode の Index of Coincidence のページの表。出典によって値が違うので、両方を示す
export const LANGUAGE_IC = [
  { id: 'english', friedman: 1.73, dcode: 0.0667 },
  { id: 'french', friedman: 2.02, dcode: 0.0778 },
  { id: 'german', friedman: 2.05, dcode: 0.0762 },
  { id: 'italian', friedman: 1.94, dcode: 0.0738 },
  { id: 'spanish', friedman: 1.94, dcode: 0.077 },
  { id: 'portuguese', friedman: 1.94, dcode: null }
];
