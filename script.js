// グローバル変数
let currentStep = 1;
const totalSteps = 5;
let currentTab = 'learn';
let analysisText = '';
let monteCarloRunning = false;
let monteCarloData = [];
let convergenceChart = null;

// サンプルデータ
const samples = {
  english: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. In cryptanalysis, the Index of Coincidence is a statistical measure used to determine the likelihood that two randomly selected characters from a text are the same. English text typically has an IC value around 0.067, which reflects the natural frequency distribution of letters in the language. Common letters like E, T, A, O, I, N appear much more frequently than rare letters like Q, X, Z, making the probability of selecting matching characters higher than in truly random text.",
  random: "QJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUSQJXZFWHMKPVYGLNBRCTDAEIOUS",
  caesar: "WKH TXLFN EURZQ IRA MXPSV RYHU WKH ODCB GRJ. WKLV LV DQ HADPSOH RI D FDHVDU FLSKHU ZLWK D VKLIW RI WKUHH SRVLWLRQV. LQ WKLV HQFUBSWLRQ PHWKRG, HDFK OHWWHU LQ WKH SODLQWHAW LV UHSODFHG EB WKH OHWWHU WKUHH SRVLWLRQV ODWHU LQ WKH DOSKDEHW. VLQFH WKLV LV D VLPSOH VXEVWLWXWLRQ FLSKHU, WKH IUHTXHQFB GLVWULEXWLRQ RI OHWWHUV UHPDLQV WKH VDPH DV WKH RULJLQDO WHAW, UHVXOWLQJ LQ DQ LF YDOXH VLPLODU WR QDWXUDO ODQJXDJH.",
  vigenere: "VJG SWKEM DTQYP HQZ LWORU QXGT VJG NCBA FQI. VJKU KU CP GZCORNG QH C XKIGPGTG EKRJGT YKVJ VJG MGa YQTF KEY. KP VJKU RQNACRJCDGVKE EKRJGT, GCEJ NGVVGT KP VJG RNCPVGZV KU GPETARVGF WUKPI C FKHHGTGPV EGUCV UJKHV DCUGF QP VJG EQTTGURQPFKPI NGVVGT KP VJG TGRGCVGf MGA. VJKU OGVJQF RTQFWEGU CP KE XCNWG OGTYGP PCVWTCN NCPIWCIG CPF TCPFQO VGZV, CXTCIKPI CTQWPF HQTVA RGTEGPV QH VJG PCVWTCN NCPIWCIG XCNWG.",
  german: "Der schnelle braune Fuchs springt über den faulen Hund. Dies ist ein Beispiel für deutschen Text. Die deutsche Sprache hat ihre eigene charakteristische Buchstabenverteilung, die sich von anderen europäischen Sprachen unterscheidet. Häufige Buchstaben wie E, N, I, S, R, A treten öfter auf als seltene Buchstaben wie Q, X, Y. Der Index of Coincidence für deutschen Text liegt typischerweise zwischen 0.072 und 0.076, was etwas höher ist als bei englischen Texten. Dies spiegelt die spezifischen Eigenschaften der deutschen Orthographie und Wortbildung wider.",
  french: "Le renard brun et rapide saute par-dessus le chien paresseux. Ceci est un exemple de texte français. La langue française possède sa propre distribution caractéristique des lettres, influencée par la phonétique et l'orthographe française. Les lettres fréquentes comme E, A, I, S, N, T, R apparaissent plus souvent que les lettres rares comme W, K, Z. L'Index de Coïncidence pour le français se situe généralement entre 0.074 et 0.078, reflétant les particularités de cette langue romane avec ses voyelles accentuées et ses consonnes spécifiques.",
  repeated: "AAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAABBBBBBCCCCCCDDDDDDEEEEEE"
};

// 言語IC範囲
const languageIC = {
  random: { min: 0.035, max: 0.042, name: "ランダム" },
  english: { min: 0.065, max: 0.070, name: "英語" },
  german: { min: 0.072, max: 0.076, name: "ドイツ語" },
  french: { min: 0.074, max: 0.078, name: "フランス語" },
  cipher: { min: 0.038, max: 0.050, name: "多表式暗号" }
};

// セキュリティ関数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function validateInput(text) {
  if (typeof text !== 'string') {
    throw new Error('入力はテキスト形式である必要があります');
  }
  if (text.length > 100000) {
    throw new Error('テキストが長すぎます');
  }
  return true;
}

// エラー処理
function showError(message) {
  console.error(message);
  // 簡単なアラート表示（本番では改善）
  alert(message);
}

// ユーティリティ関数
function normalize(text, keepAZ = true, removeSpaces = true) {
  try {
    validateInput(text);
    let t = text.toUpperCase();
    if (removeSpaces) t = t.replace(/[\s\p{P}\p{S}]/gu, "");
    if (keepAZ) t = t.replace(/[^A-Z]/g, "");
    return t;
  } catch (error) {
    showError(error.message);
    return "";
  }
}

function calcIC(text) {
  try {
    if (text.length < 2) return 0;
    
    const counts = {};
    for (let i = 0; i < 26; i++) {
      counts[String.fromCharCode(65 + i)] = 0;
    }
    
    for (const char of text) {
      if (counts.hasOwnProperty(char)) {
        counts[char]++;
      }
    }
    
    let sumNi = 0;
    for (const char in counts) {
      const n = counts[char];
      sumNi += n * (n - 1);
    }
    
    const N = text.length;
    const denom = N * (N - 1);
    
    return denom > 0 ? sumNi / denom : 0;
  } catch (error) {
    showError(error.message);
    return 0;
  }
}

function getCharCounts(text) {
  const counts = {};
  for (let i = 0; i < 26; i++) {
    counts[String.fromCharCode(65 + i)] = 0;
  }
  
  for (const char of text) {
    if (counts.hasOwnProperty(char)) {
      counts[char]++;
    }
  }
  
  return counts;
}

// タブ管理
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // アクティブ状態更新
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
      
      currentTab = targetTab;
      
      // タブ切り替え時の初期化
      if (targetTab === 'monte') {
        initMonteCarloChart();
      }
    });
  });
}

// ステップ学習タブ
function initStepLearning() {
  const prevBtn = document.getElementById('prevStep');
  const nextBtn = document.getElementById('nextStep');
  const calcBtn = document.getElementById('calcSimple');
  
  prevBtn.addEventListener('click', () => changeStep(-1));
  nextBtn.addEventListener('click', () => changeStep(1));
  calcBtn.addEventListener('click', calculateSimple);
  
  // クイズボタン
  document.querySelectorAll('.btn-check').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const quizNum = e.target.dataset.quiz;
      checkQuiz(quizNum);
    });
  });
  
  updateStepDisplay();
  initPatternExamples();
}

function changeStep(direction) {
  const newStep = currentStep + direction;
  if (newStep < 1 || newStep > totalSteps) return;
  
  // 現在のステップを非アクティブに
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
  
  currentStep = newStep;
  
  // 新しいステップをアクティブに
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
  
  updateStepDisplay();
}

function updateStepDisplay() {
  document.getElementById('currentStep').textContent = currentStep;
  document.getElementById('totalSteps').textContent = totalSteps;
  
  // ナビボタンの状態更新
  document.getElementById('prevStep').disabled = currentStep === 1;
  document.getElementById('nextStep').disabled = currentStep === totalSteps;
}

function calculateSimple() {
  const input = document.getElementById('simpleText').value;
  const text = normalize(input, true, true);
  
  if (text.length < 2) {
    showError('最低2文字必要です');
    return;
  }
  
  const counts = getCharCounts(text);
  const ic = calcIC(text);
  
  // テーブル更新
  const tbody = document.getElementById('freqTableBody');
  tbody.innerHTML = '';
  
  let totalCombinations = 0;
  for (const char in counts) {
    const count = counts[char];
    if (count > 0) {
      const combinations = count * (count - 1);
      totalCombinations += combinations;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${char}</td>
        <td>${count}</td>
        <td>${combinations}</td>
      `;
      tbody.appendChild(row);
    }
  }
  
  // 計算結果更新
  const N = text.length;
  const denom = N * (N - 1);
  
  document.getElementById('stepN').textContent = N;
  document.getElementById('stepDenom').textContent = denom;
  document.getElementById('stepNum').textContent = totalCombinations;
  document.getElementById('stepIC').textContent = ic.toFixed(4);
  
  // 計算過程を表示
  document.getElementById('denomCalc').textContent = `= ${N} × ${N - 1}`;
  document.getElementById('icCalc').textContent = `= ${totalCombinations} ÷ ${denom}`;
}

function initPatternExamples() {
  // パターン例のバーチャート作成
  const patterns = [
    { text: 'ABCDEFGHIJ', element: 'pattern1' }, // すべて異なる
    { text: 'QJXZFWHMKP', element: 'pattern2' }, // ランダム例
    { text: 'AABBCCDDEE', element: 'pattern3' }, // 少数文字均等
    { text: 'AAAAAABBCD', element: 'pattern4' }  // 偏り
  ];
  
  patterns.forEach(pattern => {
    const counts = getCharCounts(pattern.text);
    createMiniBarChart(pattern.element, counts);
  });
}

function createMiniBarChart(elementId, counts) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.innerHTML = '';
  
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount === 0) return;
  
  for (const char in counts) {
    const count = counts[char];
    if (count > 0) {
      const bar = document.createElement('div');
      bar.style.width = '8px';
      bar.style.height = `${(count / maxCount) * 40}px`;
      bar.style.backgroundColor = '#3b82f6';
      bar.style.marginRight = '1px';
      element.appendChild(bar);
    }
  }
}

function checkQuiz(quizNum) {
  const answers = {
    1: 'b', // AAAAAA が最もICが高い
    2: 'b'  // 特定文字の出現頻度が高いから
  };
  
  const selectedAnswer = document.querySelector(`input[name="q${quizNum}"]:checked`);
  if (!selectedAnswer) {
    showError('答えを選択してください');
    return;
  }
  
  const resultElement = document.getElementById(`result${quizNum}`);
  const isCorrect = selectedAnswer.value === answers[quizNum];
  
  resultElement.style.display = 'block';
  resultElement.className = `quiz-result ${isCorrect ? 'correct' : 'incorrect'}`;
  
  if (isCorrect) {
    resultElement.textContent = '正解です！素晴らしい理解です。';
  } else {
    resultElement.textContent = '惜しい！もう一度考えてみましょう。';
  }
}

// ヘルプモーダル
function initHelpModal() {
  const modal = document.getElementById('helpModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeBtn = document.querySelector('.modal-close');
  
  // ヘルプコンテンツ
  const helpContent = {
    'pair-count': {
      title: 'n(n-1) の意味',
      content: `
        <h4>📖 同じ文字から2つを順序付きで選ぶ方法の数</h4>
        <p><strong>なぜ n(n-1) なのか？</strong></p>
        <ul>
          <li><strong>1つ目を選ぶ:</strong> n通りの方法</li>
          <li><strong>2つ目を選ぶ:</strong> 残りの(n-1)通りの方法</li>
          <li><strong>合計:</strong> n × (n-1) 通り</li>
        </ul>
        
        <div class="highlight">
          <strong>具体例:</strong><br>
          • 文字Lが2個 → 2×1 = 2通り<br>
          • 文字Aが3個 → 3×2 = 6通り<br>
          • 文字Eが1個 → 1×0 = 0通り
        </div>
        
        <p><strong>ICの計算では:</strong></p>
        <p>すべての文字について n(n-1) を計算し、合計します（Σn(n-1)）。
        これが「同じ文字のペアを選ぶ全ての方法の数」になります。</p>
      `
    },
    'ic-ranges': {
      title: 'IC値の判定範囲',
      content: `
        <h4>📊 テキストタイプ別のIC値範囲</h4>
        
        <div style="margin: 16px 0;">
          <div style="display: grid; gap: 12px;">
            <div style="padding: 12px; background: #dcfce7; border-radius: 8px; border-left: 4px solid #16a34a;">
              <strong>🌍 自然言語: 0.065 - 0.080</strong><br>
              <span style="font-size: 0.9rem; color: #166534;">英語、ドイツ語、フランス語などの自然言語。特定文字の頻度偏りにより高いIC値を示す。</span>
            </div>
            
            <div style="padding: 12px; background: #fff7ed; border-radius: 8px; border-left: 4px solid #ea580c;">
              <strong>🔄 単一換字暗号/混合: 0.045 - 0.065</strong><br>
              <span style="font-size: 0.9rem; color: #9a3412;">シーザー暗号や単純置換暗号。頻度分布が保持されるため中程度のIC値。</span>
            </div>
            
            <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #64748b;">
              <strong>🎲 ランダム/多表式暗号: 0.035 - 0.045</strong><br>
              <span style="font-size: 0.9rem; color: #475569;">ヴィジュネル暗号やランダム文字列。頻度分布が平坦化されて低いIC値。</span>
            </div>
            
            <div style="padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
              <strong>⚠️ 極低IC値: < 0.035</strong><br>
              <span style="font-size: 0.9rem; color: #991b1b;">非常に均等な分布または特殊処理されたテキスト。</span>
            </div>
            
            <div style="padding: 12px; background: #fefce8; border-radius: 8px; border-left: 4px solid #eab308;">
              <strong>📈 偏重テキスト: > 0.080</strong><br>
              <span style="font-size: 0.9rem; color: #a16207;">特定文字が異常に多い人工的なテキスト。繰り返しパターンなど。</span>
            </div>
          </div>
        </div>
        
        <div class="highlight">
          <strong>💡 活用のヒント:</strong><br>
          これらの範囲を使って、未知のテキストが暗号文か自然言語かを判別したり、
          暗号の種類を推定したりできます。
        </div>
      `
    }
  };
  
  // ヘルプアイコンクリック
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('help-icon')) {
      const helpType = e.target.dataset.help;
      const content = helpContent[helpType];
      
      if (content) {
        modalTitle.textContent = content.title;
        modalBody.innerHTML = content.content;
        modal.classList.add('show');
      }
    }
  });
  
  // モーダル閉じる
  function closeModal() {
    modal.classList.remove('show');
  }
  
  closeBtn.addEventListener('click', closeModal);
  
  // モーダル外クリックで閉じる
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // ESCキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });
}

// サンプル分析タブ
function initSampleAnalysis() {
  const sampleButtons = document.querySelectorAll('.sample-btn');
  const analyzeBtn = document.getElementById('btnAnalyze');
  const textArea = document.getElementById('analyzeText');
  
  sampleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sampleType = btn.dataset.sample;
      
      // アクティブ状態更新
      sampleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (sampleType === 'custom') {
        textArea.value = '';
        textArea.focus();
      } else if (samples[sampleType]) {
        textArea.value = samples[sampleType];
        performAnalysis();
      }
    });
  });
  
  analyzeBtn.addEventListener('click', performAnalysis);
  
  // 初期サンプル設定
  textArea.value = samples.english;
  // 英語サンプルボタンをアクティブに
  const englishBtn = document.querySelector('.sample-btn[data-sample="english"]');
  if (englishBtn) {
    englishBtn.classList.add('active');
  }
  performAnalysis();
}

function performAnalysis() {
  const rawText = document.getElementById('analyzeText').value;
  const keepAZ = document.getElementById('analyzeAZ').checked;
  const removeSpaces = document.getElementById('analyzeSpaces').checked;
  
  if (!rawText.trim()) {
    showError('テキストを入力してください');
    return;
  }
  
  const processedText = normalize(rawText, keepAZ, removeSpaces);
  
  if (processedText.length < 2) {
    showError('処理後のテキストが短すぎます');
    return;
  }
  
  analysisText = processedText;
  
  const counts = getCharCounts(processedText);
  const ic = calcIC(processedText);
  
  // 結果表示更新
  updateAnalysisResults(processedText, counts, ic);
  createFrequencyChart(counts);
  updateICComparison(ic);
  inferTextType(ic);
}

function updateAnalysisResults(text, counts, ic) {
  document.getElementById('metricN').textContent = text.length.toLocaleString();
  document.getElementById('metricIC').textContent = ic.toFixed(4);
  document.getElementById('currentICValue').textContent = ic.toFixed(4);
}

function createFrequencyChart(counts) {
  const chartElement = document.getElementById('analysisChart');
  chartElement.innerHTML = '';
  
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount === 0) return;
  
  for (const char in counts) {
    const count = counts[char];
    const height = maxCount > 0 ? (count / maxCount) * 160 : 0;
    
    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 4px;
      height: ${height}px;
      background: linear-gradient(to top, #3b82f6, #60a5fa);
      margin: 0 1px;
      border-radius: 2px 2px 0 0;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    `;
    
    // ツールチップ
    bar.title = `${char}: ${count}回`;
    
    chartElement.appendChild(bar);
  }
}

function updateICComparison(ic) {
  const currentBar = document.getElementById('currentICBar');
  const percentage = Math.min((ic / 0.1) * 100, 100); // 0.1を最大値として正規化
  currentBar.style.width = `${percentage}%`;
  
  // 色を IC値に応じて変更
  if (ic < 0.04) {
    currentBar.style.backgroundColor = '#64748b'; // グレー（ランダム）
  } else if (ic > 0.065) {
    currentBar.style.backgroundColor = '#10b981'; // グリーン（自然言語）
  } else {
    currentBar.style.backgroundColor = '#f59e0b'; // オレンジ（中間）
  }
}

function inferTextType(ic) {
  const typeElement = document.getElementById('metricType');
  const inferenceElement = document.getElementById('typeInference');
  
  let type = '不明';
  let description = '';
  let confidence = '';
  
  if (ic >= 0.065 && ic <= 0.080) {
    type = '自然言語';
    description = 'IC値が自然言語の範囲内です。英語やヨーロッパ言語の可能性が高いです。';
    confidence = '確度: 高';
  } else if (ic >= 0.035 && ic <= 0.045) {
    type = 'ランダム/多表式暗号';
    description = 'IC値がランダム文字列または多表式暗号の範囲です。ヴィジュネル暗号などの可能性があります。';
    confidence = '確度: 中';
  } else if (ic >= 0.045 && ic <= 0.065) {
    type = '単一換字暗号/混合';
    description = 'IC値が中程度です。単一換字式暗号や言語の混合テキストの可能性があります。';
    confidence = '確度: 中';
  } else if (ic > 0.080) {
    type = '偏重テキスト';
    description = 'IC値が非常に高いです。特定文字が異常に多い人工的なテキストの可能性があります。';
    confidence = '確度: 高';
  } else {
    type = '極低IC値';
    description = `IC値が非常に低い（${ic.toFixed(4)} < 0.035）です。特殊な処理が施されたテキストや非常に均等な分布の可能性があります。`;
    confidence = '確度: 低';
  }
  
  typeElement.textContent = type;
  inferenceElement.innerHTML = `
    <div style="margin-bottom: 8px;"><strong>${type}</strong> ${confidence}</div>
    <div style="color: var(--text-secondary); font-size: 0.9rem;">${description}</div>
  `;
}

// モンテカルロタブ
function initMonteCarlo() {
  const startBtn = document.getElementById('monteStart');
  const stopBtn = document.getElementById('monteStop');
  const resetBtn = document.getElementById('monteReset');
  const sourceSelect = document.getElementById('monteTextSource');
  const customTextArea = document.getElementById('monteCustomText');
  
  startBtn.addEventListener('click', startMonteCarlo);
  stopBtn.addEventListener('click', stopMonteCarlo);
  resetBtn.addEventListener('click', resetMonteCarlo);
  
  // ソース選択変更時の処理
  sourceSelect.addEventListener('change', handleSourceChange);
  
  // カスタムテキスト入力時の処理
  if (customTextArea) {
    customTextArea.addEventListener('input', updateCustomTextInfo);
  }
  
  // 初期テキストプレビューを表示
  updateTextPreview();
  
  initMonteCarloChart();
}

function handleSourceChange() {
  const sourceSelect = document.getElementById('monteTextSource');
  const customSection = document.getElementById('customTextSection');
  
  if (sourceSelect.value === 'custom') {
    customSection.style.display = 'block';
    updateCustomTextInfo();
  } else {
    customSection.style.display = 'none';
  }
  
  // テキストプレビューを更新
  updateTextPreview();
}

function updateCustomTextInfo() {
  const customTextArea = document.getElementById('monteCustomText');
  const lengthSpan = document.getElementById('customTextLength');
  const processedSpan = document.getElementById('customTextProcessed');
  
  if (!customTextArea || !lengthSpan || !processedSpan) return;
  
  const rawText = customTextArea.value;
  const processedText = normalize(rawText, true, true);
  
  lengthSpan.textContent = rawText.length.toLocaleString();
  processedSpan.textContent = processedText.length.toLocaleString() + '文字';
  
  // テキストプレビューも更新
  updateTextPreview();
}

function updateTextPreview() {
  const sourceSelect = document.getElementById('monteTextSource');
  const previewElement = document.getElementById('textPreview');
  const lengthElement = document.getElementById('previewLength');
  const icElement = document.getElementById('previewIC');
  
  if (!sourceSelect || !previewElement) return;
  
  let sourceText = '';
  let rawText = '';
  const sourceType = sourceSelect.value;
  
  if (sourceType === 'current') {
    sourceText = analysisText || normalize(samples.english, true, true);
    rawText = '現在の分析テキスト';
  } else if (sourceType === 'custom') {
    const customTextArea = document.getElementById('monteCustomText');
    rawText = customTextArea ? customTextArea.value : '';
    sourceText = normalize(rawText, true, true);
  } else if (samples[sourceType]) {
    rawText = samples[sourceType];
    sourceText = normalize(rawText, true, true);
  } else {
    rawText = samples.english;
    sourceText = normalize(rawText, true, true);
  }
  
  // プレビューテキストを表示（最初の300文字程度）
  const displayText = rawText.length > 300 ? rawText.substring(0, 300) + '...' : rawText;
  previewElement.textContent = displayText || 'テキストを選択してください';
  
  // 統計情報を更新
  lengthElement.textContent = sourceText.length.toLocaleString();
  
  if (sourceText.length >= 2) {
    const ic = calcIC(sourceText);
    icElement.textContent = ic.toFixed(4);
  } else {
    icElement.textContent = '0.0000';
  }
}

function initMonteCarloChart() {
  const canvas = document.getElementById('convergenceCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = 150;
  
  convergenceChart = {
    canvas,
    ctx,
    data: [],
    theoreticalIC: 0
  };
  
  drawChart();
}

function startMonteCarlo() {
  const sourceSelect = document.getElementById('monteTextSource');
  const trialsInput = document.getElementById('monteTrials');
  const speedSelect = document.getElementById('monteSpeed');
  
  let sourceText = '';
  const sourceType = sourceSelect.value;
  
  if (sourceType === 'current') {
    sourceText = analysisText || samples.english;
  } else if (sourceType === 'custom') {
    const customTextArea = document.getElementById('monteCustomText');
    const customText = customTextArea ? customTextArea.value : '';
    if (!customText.trim()) {
      showError('カスタムテキストを入力してください');
      return;
    }
    sourceText = normalize(customText, true, true);
  } else if (samples[sourceType]) {
    sourceText = normalize(samples[sourceType], true, true);
  } else {
    sourceText = normalize(samples.english, true, true);
  }
  
  if (sourceText.length < 2) {
    showError('テキストが短すぎます');
    return;
  }
  
  const totalTrials = Math.max(100, Math.min(100000, parseInt(trialsInput.value) || 1000));
  const speed = speedSelect.value;
  
  // 理論IC計算
  const theoreticalIC = calcIC(sourceText);
  convergenceChart.theoreticalIC = theoreticalIC;
  document.getElementById('theoreticalIC').textContent = theoreticalIC.toFixed(4);
  
  // モンテカルロ開始
  monteCarloRunning = true;
  monteCarloData = { trials: 0, matches: 0, history: [] };
  
  document.getElementById('monteStart').disabled = true;
  document.getElementById('monteStop').disabled = false;
  
  runMonteCarloLoop(sourceText, totalTrials, speed);
}

function runMonteCarloLoop(text, totalTrials, speed) {
  if (!monteCarloRunning) return;
  
  const chunkSize = speed === 'slow' ? 1 : speed === 'normal' ? 10 : 50;
  const delay = speed === 'slow' ? 500 : speed === 'normal' ? 100 : 10;
  
  for (let i = 0; i < chunkSize && monteCarloData.trials < totalTrials && monteCarloRunning; i++) {
    performSingleTrial(text);
  }
  
  updateMonteCarloDisplay(text);
  
  if (monteCarloData.trials < totalTrials && monteCarloRunning) {
    setTimeout(() => runMonteCarloLoop(text, totalTrials, speed), delay);
  } else {
    stopMonteCarlo();
  }
}

function performSingleTrial(text) {
  const N = text.length;
  let pos1 = Math.floor(Math.random() * N);
  let pos2 = Math.floor(Math.random() * N);
  
  // 同じ位置を避ける
  while (pos2 === pos1) {
    pos2 = Math.floor(Math.random() * N);
  }
  
  const char1 = text[pos1];
  const char2 = text[pos2];
  const match = char1 === char2;
  
  monteCarloData.trials++;
  if (match) monteCarloData.matches++;
  
  // 履歴に追加（最新の試行情報）
  monteCarloData.lastTrial = { pos1, pos2, char1, char2, match };
  
  // 収束データ記録（100回ごと）
  if (monteCarloData.trials % 100 === 0) {
    const currentIC = monteCarloData.matches / monteCarloData.trials;
    monteCarloData.history.push({
      trial: monteCarloData.trials,
      ic: currentIC
    });
    convergenceChart.data = monteCarloData.history;
    drawChart();
  }
}

function updateMonteCarloDisplay(text) {
  const { trials, matches, lastTrial } = monteCarloData;
  const currentIC = trials > 0 ? matches / trials : 0;
  
  // 統計更新
  document.getElementById('trialCount').textContent = trials.toLocaleString();
  document.getElementById('matchCount').textContent = matches.toLocaleString();
  document.getElementById('experimentalIC').textContent = currentIC.toFixed(4);
  
  // 最新試行表示
  if (lastTrial) {
    const textDisplay = document.getElementById('monteTextDisplay');
    textDisplay.innerHTML = '';
    
    // テキストを表示（選択位置をハイライト）
    for (let i = 0; i < Math.min(text.length, 50); i++) {
      const span = document.createElement('span');
      span.textContent = text[i];
      
      if (i === lastTrial.pos1 || i === lastTrial.pos2) {
        span.className = 'highlight-char';
      }
      
      textDisplay.appendChild(span);
    }
    
    if (text.length > 50) {
      textDisplay.appendChild(document.createTextNode('...'));
    }
    
    document.getElementById('pos1').textContent = lastTrial.pos1;
    document.getElementById('char1').textContent = lastTrial.char1;
    document.getElementById('pos2').textContent = lastTrial.pos2;
    document.getElementById('char2').textContent = lastTrial.char2;
    
    const matchBadge = document.querySelector('.match-badge');
    matchBadge.textContent = lastTrial.match ? 'YES' : 'NO';
    matchBadge.className = `match-badge ${lastTrial.match ? 'yes' : 'no'}`;
  }
  
  // プログレスバー更新
  const progress = document.getElementById('monteProgress');
  const percentage = trials > 0 ? Math.min((trials / parseInt(document.getElementById('monteTrials').value)) * 100, 100) : 0;
  progress.style.width = `${percentage}%`;
}

function drawChart() {
  if (!convergenceChart || !convergenceChart.ctx) return;
  
  const { ctx, canvas, data, theoreticalIC } = convergenceChart;
  const width = canvas.width;
  const height = canvas.height;
  
  // キャンバスクリア
  ctx.clearRect(0, 0, width, height);
  
  // フォント設定
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // マージン設定
  const leftMargin = 50;
  const rightMargin = 20;
  const topMargin = 20;
  const bottomMargin = 30;
  const chartWidth = width - leftMargin - rightMargin;
  const chartHeight = height - topMargin - bottomMargin;
  
  // 軸の描画
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Y軸
  ctx.moveTo(leftMargin, topMargin);
  ctx.lineTo(leftMargin, height - bottomMargin);
  // X軸
  ctx.moveTo(leftMargin, height - bottomMargin);
  ctx.lineTo(width - rightMargin, height - bottomMargin);
  ctx.stroke();
  
  // Y軸目盛り（IC値）
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  const icSteps = [0, 0.02, 0.04, 0.06, 0.08, 0.10];
  icSteps.forEach(ic => {
    const y = height - bottomMargin - (ic / 0.1) * chartHeight;
    
    // 目盛り線
    ctx.strokeStyle = ic === 0 ? '#64748b' : '#e2e8f0';
    ctx.lineWidth = ic === 0 ? 1 : 0.5;
    ctx.beginPath();
    ctx.moveTo(leftMargin - 3, y);
    ctx.lineTo(leftMargin, y);
    if (ic > 0) {
      ctx.lineTo(width - rightMargin, y);
    }
    ctx.stroke();
    
    // ラベル
    ctx.fillText(ic.toFixed(2), leftMargin - 6, y);
  });
  
  // X軸目盛り（試行回数）
  if (data.length > 0) {
    const maxTrials = data[data.length - 1].trial;
    const xSteps = 5;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    for (let i = 0; i <= xSteps; i++) {
      const trials = Math.round((maxTrials / xSteps) * i);
      const x = leftMargin + (i / xSteps) * chartWidth;
      
      // 目盛り線
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, height - bottomMargin);
      ctx.lineTo(x, height - bottomMargin + 3);
      if (i > 0) {
        ctx.lineTo(x, topMargin);
      }
      ctx.stroke();
      
      // ラベル
      ctx.fillText(trials.toLocaleString(), x, height - bottomMargin + 6);
    }
  }
  
  // 軸ラベル
  ctx.fillStyle = '#1e293b';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
  // Y軸ラベル
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('IC値', 0, 0);
  ctx.restore();
  
  // X軸ラベル
  ctx.textAlign = 'center';
  ctx.fillText('試行回数', width / 2, height - 5);
  
  // 理論IC線
  if (theoreticalIC > 0) {
    const y = height - bottomMargin - (theoreticalIC / 0.1) * chartHeight;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(leftMargin, y);
    ctx.lineTo(width - rightMargin, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 理論IC値ラベル
    ctx.fillStyle = '#10b981';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`理論IC: ${theoreticalIC.toFixed(4)}`, leftMargin + 5, y - 8);
  }
  
  // データ線
  if (data.length > 1) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const maxTrials = data[data.length - 1].trial;
    
    data.forEach((point, index) => {
      const x = leftMargin + ((point.trial / maxTrials) * chartWidth);
      const y = height - bottomMargin - (point.ic / 0.1) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }
}

function stopMonteCarlo() {
  monteCarloRunning = false;
  document.getElementById('monteStart').disabled = false;
  document.getElementById('monteStop').disabled = true;
}

function resetMonteCarlo() {
  stopMonteCarlo();
  
  monteCarloData = { trials: 0, matches: 0, history: [] };
  convergenceChart.data = [];
  
  // 表示リセット
  document.getElementById('trialCount').textContent = '0';
  document.getElementById('matchCount').textContent = '0';
  document.getElementById('experimentalIC').textContent = '0.0000';
  document.getElementById('theoreticalIC').textContent = '0.0000';
  
  document.getElementById('pos1').textContent = '-';
  document.getElementById('char1').textContent = '-';
  document.getElementById('pos2').textContent = '-';
  document.getElementById('char2').textContent = '-';
  
  const matchBadge = document.querySelector('.match-badge');
  matchBadge.textContent = '-';
  matchBadge.className = 'match-badge';
  
  document.getElementById('monteProgress').style.width = '0%';
  document.getElementById('monteTextDisplay').innerHTML = '';
  
  drawChart();
}

// 応用タブ
function initAdvanced() {
  const estimateBtn = document.getElementById('estimateKeyLength');
  
  if (estimateBtn) {
    estimateBtn.addEventListener('click', estimateVigenereKeyLength);
  }
}

function estimateVigenereKeyLength() {
  const ciphertext = document.getElementById('vigenereText').value;
  const resultElement = document.getElementById('keyLengthResult');
  
  if (!ciphertext.trim()) {
    resultElement.innerHTML = '<div style="color: var(--danger);">暗号文を入力してください</div>';
    return;
  }
  
  const normalized = normalize(ciphertext, true, true);
  
  if (normalized.length < 20) {
    resultElement.innerHTML = '<div style="color: var(--danger);">暗号文が短すぎます（最低20文字必要）</div>';
    return;
  }
  
  const results = [];
  
  // 鍵長1-20を試行
  for (let keyLen = 1; keyLen <= Math.min(20, Math.floor(normalized.length / 3)); keyLen++) {
    let avgIC = 0;
    let validColumns = 0;
    
    // 各列のICを計算
    for (let col = 0; col < keyLen; col++) {
      let columnText = '';
      for (let i = col; i < normalized.length; i += keyLen) {
        columnText += normalized[i];
      }
      
      if (columnText.length >= 3) {
        avgIC += calcIC(columnText);
        validColumns++;
      }
    }
    
    if (validColumns > 0) {
      avgIC /= validColumns;
      results.push({ keyLength: keyLen, avgIC });
    }
  }
  
  // 結果をIC値でソート（高い順）
  results.sort((a, b) => b.avgIC - a.avgIC);
  
  let html = '<h4>鍵長推定結果</h4><table style="width: 100%; border-collapse: collapse;">';
  html += '<tr style="background: var(--bg-accent);"><th style="padding: 8px; border: 1px solid var(--border);">鍵長</th><th style="padding: 8px; border: 1px solid var(--border);">平均IC</th><th style="padding: 8px; border: 1px solid var(--border);">可能性</th></tr>';
  
  results.slice(0, 5).forEach((result, index) => {
    const possibility = result.avgIC > 0.06 ? '高' : result.avgIC > 0.045 ? '中' : '低';
    const bgColor = index === 0 ? 'background: var(--bg-accent);' : '';
    html += `<tr style="${bgColor}">
      <td style="padding: 8px; border: 1px solid var(--border); text-align: center;">${result.keyLength}</td>
      <td style="padding: 8px; border: 1px solid var(--border); text-align: center;">${result.avgIC.toFixed(4)}</td>
      <td style="padding: 8px; border: 1px solid var(--border); text-align: center;">${possibility}</td>
    </tr>`;
  });
  
  html += '</table>';
  
  if (results.length > 0) {
    const topResult = results[0];
    html += `<div style="margin-top: 16px; padding: 12px; background: var(--bg-accent); border-radius: var(--radius);">
      <strong>推定結果:</strong> 鍵長 ${topResult.keyLength} が最も有力です（IC = ${topResult.avgIC.toFixed(4)}）
    </div>`;
  }
  
  resultElement.innerHTML = html;
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  try {
    initTabs();
    initStepLearning();
    initSampleAnalysis();
    initMonteCarlo();
    initAdvanced();
    initHelpModal(); // すべてのタブでヘルプモーダルを使用可能に
    
    console.log('IC Learning Visualizer v2.0 初期化完了');
  } catch (error) {
    console.error('初期化エラー:', error);
    showError('アプリケーションの初期化に失敗しました');
  }
});

// リサイズ対応
window.addEventListener('resize', () => {
  if (convergenceChart && convergenceChart.canvas) {
    const canvas = convergenceChart.canvas;
    canvas.width = canvas.offsetWidth;
    drawChart();
  }
});