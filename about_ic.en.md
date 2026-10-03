# Index of Coincidence (IC)

## What IC is and why it matters

The **index of coincidence (IC)** is a statistic that gives the probability that two letters picked at random from a text are the same letter.  
The cryptologist William Friedman introduced it in the 1920s as a tool for breaking classical ciphers.

- **From the cryptanalyst's point of view**  
  In natural language text, letters do not appear uniformly (in English, for example, E is common and Z is rare).  
  So the IC of natural language is higher than that of a random string.  
  Cryptanalysts use this difference to tell a simple substitution cipher from a polyalphabetic one (such as the Vigenère cipher) and to estimate the key length.

- **From the linguistic and statistical point of view**  
  IC measures how skewed the letter distribution is.  
  Each language has its own letter frequencies, and this shows in its IC.  
  For example, the IC of English is about 0.066 to 0.068, and the IC of a random string is 0.0385.  
  This gives a clue to the question "Is this text meaningful language or random noise?"

---

## Definition and derivation

Let the length of the text be $N$, the number of letters in the alphabet be $n$, and the number of times letter $i$ appears be $m_i$.  
The index of coincidence is defined as:

\[
IC = \sum_{i=1}^n \frac{m_i}{N} \cdot \frac{m_i - 1}{N - 1}
\]

This is the probability of drawing the same letter $i$ twice. Rearranged:

\[
IC = \frac{1}{N(N-1)} \sum_{i=1}^n m_i (m_i - 1)
\]

- Numerator: the number of ways to choose a "pair of the same letter" from the text  
- Denominator: the number of ways to choose any pair of letters  

In other words, IC is **the share of matching pairs**.

Using the probability of each letter $p_i = m_i / N$, for large $N$ it is approximately

\[
IC \approx \sum_{i=1}^n p_i^2
\]

So IC can also be seen as the "self-similarity (sum of squares)" of the letter distribution.  
The exact relation is $IC = (N \sum p_i^2 - 1) / (N - 1)$: $\sum p_i^2$ is the probability when the same position may be picked twice, and IC is a little smaller because a letter is never matched with itself (step 5 of the tool).

---

## An intuitive reading as a probability

In plain words, IC means:

> "The probability that two letters picked at random from a text match"

For example, $IC = 0.066$ means "they match about 6.6% of the time".

- Uniform distribution → every letter is equally frequent → matches are unlikely  
- Skewed distribution → common letters (such as E) appear often → matches on those letters are more likely  

---

## A visual reading

IC can also be seen as the share of positions where the same letter appears when two texts are placed one above the other. As in the tool, only the capital letters A to Z are kept (^ marks a match).

```
THEQUICKBROWNFOXJUMPSOVERTHELAZYDOGAN
THERAININSPAINSTAYSMAINLYINTHEPLAINWH
^^^  ^
```

In this example, 4 of the 37 letters (about 11%) match. The leading THE happens to line up, so with short texts the share moves around a lot. If you place two distant parts of the English text bundled with the tool (A Tale of Two Cities) one above the other, the match rate is 0.100 for 100 letters, 0.070 for 1,000, 0.0648 for 10,000 and 0.0660 for 50,000; the more letters, the closer it gets to the IC of English.

Shifting a text and overlapping it with itself is called the "kappa test". You can try it under "Shift and overlap (kappa test)" on the Cryptanalysis tab of the tool. In a Vigenère ciphertext, the match rate returns to the value of the language when the shift is a multiple of the key length. Note that even in English the match rate is low when the shift is 1 or 2 (0.038 and 0.044 for 10,000 letters), because the same letter rarely appears next to itself.

### IC as a signature of a language

In text of any language, such matches happen at a steady rate. This rate is:

- **Measurable**: it can be computed statistically
- **Different between languages**: the value depends on the language (though closely related languages differ little, and can even have the same value, as in the table below)
- **Characteristic**: it works like a "signature" of each language

### IC of major languages

The value for a language depends on which texts are counted, so it differs slightly between sources. The table shows the values from two sources.

| Language | Friedman & Callimahos (normalized → IC) | dCode |
|------|--------------------------------------|-------|
| English | 1.73 → 0.0665 | 0.0667 |
| French | 2.02 → 0.0777 | 0.0778 |
| German | 2.05 → 0.0788 | 0.0762 |
| Italian | 1.94 → 0.0746 | 0.0738 |
| Spanish | 1.94 → 0.0746 | 0.0770 |
| Portuguese | 1.94 → 0.0746 | — |
| Completely random (26 letters) | 1.00 → 0.0385 | 0.0385 |

- The normalized value is IC × 26 (1.00 when all 26 letters are equally frequent)
- Sources: W. F. Friedman and L. D. Callimahos, Military Cryptanalytics, Part I (the table in the Wikipedia article "Index of coincidence"); dCode, "Index of Coincidence"

Because of this property, IC gives a clue to the language of a ciphertext and to the method of encryption.

---

## Random text compared with natural language

- **Random string (26 letters, uniform)**  
  \[
  IC_{\text{random}} = \frac{1}{26} \approx 0.0385
  \]

- **English plaintext**  
  Measured values are roughly 0.065 to 0.070 (about 6 to 7%)  

So English is about 1.7 times (0.0667 ÷ 0.0385) as likely to match as a random string.  
This is a statistical expression of the fact that the letter frequencies of a language are uneven.  

---

## Worked example

For example, take the "English text" sample of the tool (keeping only A to Z gives $N=475$ letters):

- The sum of $m_i(m_i-1)$ over the letters is 14,664  
- $N(N-1) = 475 \times 474 = 225,150$  
- So

\[
IC = \frac{14664}{225150} \approx 0.0651
\]

This is close to the typical value for English (about 0.066). The text is short, so it is a little off the typical value.

---

## Use in cryptanalysis

- **Telling substitution from polyalphabetic ciphers**  
  A simple substitution cipher keeps the IC at the level of the plaintext.  
  A polyalphabetic cipher (such as Vigenère) flattens the distribution and lowers the IC. Averaged over 40 keys on 2,000 letters of English, the IC is about 0.052 for key length 2, about 0.044 for 5 and about 0.040 for 20; the longer the key, the closer it gets to 0.0385.

- **Estimating the key length of a Vigenère cipher (IC by period)**  
  If you assume a key length $L$ and split the ciphertext into $L$ columns,  
  with the correct $L$ each column is a simple substitution text, and its IC approaches the value of the language.  
  With a wrong $L$, the IC stays at the random level.  
  However, at multiples of the key length ($2L$, $3L$, ...) each column is also a simple substitution text, so the IC is high there as well. The shorter the columns, the more the value fluctuates, so if you only sort by IC, a multiple tends to come first. The tool puts the periods whose average column IC reaches the threshold (0.058) first, smallest first.

---

## IC in substitution and transposition ciphers

### Substitution cipher
- **The IC is the same as the plaintext**  
- Reason: a substitution cipher only replaces each letter with another, so the letter frequency distribution itself is kept.  
  - Example: if E appears 13% of the time in English plaintext, another letter (such as Q) appears 13% of the time in the ciphertext.  
  - The frequency distribution is only "relabeled", so $\sum p_i^2$ does not change, and neither does the IC.  
- **Conclusion**: for English, the IC of the ciphertext is about 0.066 to 0.068 (the same as the plaintext).

### Transposition cipher
- **The IC is also the same as the plaintext**  
- Reason: a transposition cipher only rearranges the order of the letters and does not change how often they appear.  
- **Conclusion**: the IC is the same as for the plaintext.

### Comparison and limits
- **In common**: for both substitution and transposition, IC ≈ the value of the plaintext.  
- **Differences**:
  - Substitution hides which letters are common (E → Q, and so on).
  - In transposition, common letters still appear as common letters.  
- **Limit**: IC alone cannot tell substitution from transposition.  
  → Other methods, such as letter frequency analysis or n-gram analysis, are needed.

### Summary
- **Simple substitution cipher**: IC ≈ IC of the plaintext (the value of the language)  
- **Transposition cipher**: IC ≈ IC of the plaintext (the value of the language)  
- **Polyalphabetic cipher (such as Vigenère)**: IC approaches the random level (≈ 0.038)  

**Conclusion**: IC is useful for telling "simple substitution or transposition" from "polyalphabetic",  
but further analysis is needed to tell substitution from transposition.

---

## Supporting methods when IC cannot tell them apart

The index of coincidence alone cannot tell a **simple substitution cipher** from a **transposition cipher**.  
Further analysis is needed. Typical methods are:

### 1. Letter frequency analysis
- **Substitution**: common letters are replaced by other letters, but the ciphertext still has letters that stand out as common.  
- **Transposition**: the frequency distribution is exactly the same as the plaintext (common letters stay common).  

### 2. n-gram (bigram and trigram) analysis
- **Substitution**: frequent groups such as "th", "er" and "ing" are replaced by other groups, but their frequencies remain.  
- **Transposition**: the order is broken, so the natural n-gram patterns are lost, and the distribution moves toward flat.  
- On 20,000 letters of English, comparing the IC of adjacent letter pairs as a normalized value (× 676), the plaintext and the simple substitution are both about 5.3, and columnar transposition (width 7) is about 3.0. About 3.0 is the value for letters placed independently; it does not become completely flat (1.0).  

### 3. Linguistic patterns (vowels and consonants)
- **Substitution**: the rhythm of vowels and consonants (for example, vowels rarely come in a row) is kept.  
- **Transposition**: rearranging breaks the rhythm, and unnatural clusters appear. On 20,000 letters of English, the share of two vowels in a row rises from about 5 to 6% in the plaintext to about 14 to 15% with columnar transposition (width 7), and places with four or more consonants in a row become two to three times as common.  

### 4. Dictionary attacks and readability checks
- **Substitution**: once part of the text is decrypted, dictionary words tend to appear.  
- **Transposition**: almost no part can be read as words.  

### 5. Detecting positional regularity
- **Transposition**: the letters are rearranged in columns or blocks of a fixed width, so if you find the width and the order and rearrange them back, fragments of the original text appear (this is why breaking a columnar transposition means searching for column orders that read naturally).  
- **Substitution**: it is a plain replacement, so no positional regularity arises.  

---

**Summary:**  
- Substitution → frequencies, n-grams and linguistic patterns tend to be kept.  
- Transposition → the frequencies are the same, but n-grams and word structure break down, and positional regularity appears.  

---

## IC in various ciphers

### Simple substitution cipher (1 letter → 1 letter)
- **Examples**: the Caesar cipher, general substitution ciphers  
- **IC**: the same as the plaintext (keeps the IC of the language)  
  - Reason: the frequency distribution only has its labels replaced and does not change.  
- **Conclusion**: for English, IC ≈ 0.066 to 0.068.

### Digraph substitution (2 letters → 1 symbol)
- **Example**: digraph substitution (each pair maps to one symbol)  
- **IC**: **the unit being counted is different**, so the IC is read differently from the usual one.  
  - The population is not the 26 letters but the possible digraphs (676 kinds).  
  - There are many kinds, so the IC itself is smaller than for single letters. Counting English text (20,000 letters from A Tale of Two Cities) in non-overlapping pairs gives an IC of about 0.0080 (about 0.066 for single letters).  
  - But compared as a normalized value (divided by the uniform value 1/676), it is about 5.39 (1.72 for single letters), so the skew is larger. This is because pairs such as "TH", "ER" and "ON" are common in English.  
- **Conclusion**: the raw value is smaller than for single letters, but as a normalized value it is **more skewed than for single letters**.

### Playfair cipher (2 letters → 2 letters)
- **Feature**: a many-to-many method that replaces each input pair with another pair by rules.  
- **IC**: the single-letter frequency distribution changes a lot and moves away from the IC of the plaintext.  
  - The same plaintext letter becomes different letters depending on its partner, so **the IC is lower than for simple substitution**.  
  - Measured on 2,000 letters of English encrypted with 100 random keys, the IC is about 0.046 to 0.054 (median 0.050). It does not fall all the way to the random level (0.0385).  
- **Conclusion**: harder to analyze than simple substitution, and the IC falls between the value of the language and the random value.

### Polyalphabetic cipher
- **Example**: the Vigenère cipher  
- **IC**: the value changes with the key length.  
  - Key length 1 (= simple substitution) gives the same IC as the plaintext (≈ 0.066).  
  - The longer the key, the closer the distribution gets to random, and **IC ≈ 0.038**.  
  - In practice, with a short key, part of the plaintext distribution remains and the value is in between.  
- **Conclusion**: the **drop in IC** gives a rough key length (the Friedman formula). It is only a rough guide: in a measurement made while developing the tool (key lengths 3 to 10, 100 each, 1,000 letters of English), rounding gave the right key length only 21% of the time, and within ±1 only 38%. To find key length candidates, splitting into columns by period and looking at the IC is more reliable (98% under the same conditions).

---

## Summary table

| Cipher                   | Output unit | IC tendency                      | Notes                                   |
|--------------------------|------------|----------------------------------|-----------------------------------------|
| Simple substitution      | 1 letter   | Same as plaintext (the language) | The frequency distribution is kept      |
| Digraph substitution (2→1) | 1 symbol | Higher than single letters when normalized | Reflects the strong bigram skew of the language |
| Playfair (2→2)           | 1 letter   | Lower than plaintext, about 0.046 to 0.054 | Works toward evening out letter frequencies |
| Polyalphabetic (e.g. Vigenère) | 1 letter | From the plaintext value toward random as the key grows | The observed IC gives a rough key length |

---

**Conclusion**:  
- Simple substitution and transposition → the IC is the same as the plaintext.  
- Digraph substitution → counted in pairs, the bigram skew shows up strongly in the normalized value.  
- Playfair → the frequencies are evened out, so the IC drops and falls between plaintext and random.  
- Polyalphabetic → as the key grows longer, the IC approaches the random level.  

---

## Related statistics

- **Shannon entropy**  
  Measures the average uncertainty of the letter distribution. The higher, the more random; the lower, the more skewed.  
- **Chi-squared statistic**  
  Measures how far an observed distribution is from an expected one.  
- **KL divergence (relative entropy)**  
  Measures how far one distribution is from a reference distribution.  
- **Rényi entropy (order 2)**  
  $H_2 = -\log \sum p_i^2$. Corresponds to a logarithmic transform of IC.  
- **Autocorrelation**  
  The match rate when a text is shifted and compared with itself. Used to detect repeating patterns ("Shift and overlap (kappa test)" in the tool).  

---

## References

- The paper "The Index of Coincidence and Its Applications in Cryptography"
  - Friedman presented IC in this paper in 1922.

---

## Summary

The index of coincidence is a simple and powerful measure of "how skewed the letter distribution is". It has been used in both

- cryptanalysis (especially estimating the key length of the Vigenère cipher)  
- linguistic analysis (identifying languages and characterizing letter distributions)  

It can also be understood intuitively as "the probability that two letters match", which makes it a good subject for teaching cryptography and statistics.
