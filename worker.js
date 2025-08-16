// IC Learning Visualizer - Web Worker
// 大量データ処理の非同期化

// セキュリティ関数
function escapeHtml(text) {
  const div = { textContent: text };
  return div.textContent;
}

function validateInput(text) {
  if (typeof text !== 'string') {
    throw new Error('入力はテキスト形式である必要があります');
  }
  if (text.length > 100000) {
    throw new Error('テキストが長すぎます（最大10万文字）');
  }
  
  // 潜在的に危険なパターンをチェック
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      throw new Error('許可されていない文字パターンが含まれています');
    }
  }
  
  return true;
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
    throw error;
  }
}

// IC計算
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
    throw error;
  }
}

// 文字カウント
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

// モンテカルロ単一試行
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
  
  return { pos1, pos2, char1, char2, match };
}

// モンテカルロバッチ処理
function runMonteCarloBatch(text, batchSize, startTrial = 0) {
  const results = [];
  let matches = 0;
  
  for (let i = 0; i < batchSize; i++) {
    const trial = performSingleTrial(text);
    if (trial.match) matches++;
    
    results.push({
      trial: startTrial + i + 1,
      ...trial,
      currentMatches: matches,
      currentIC: matches / (i + 1)
    });
  }
  
  return {
    results,
    totalMatches: matches,
    batchSize
  };
}

// ヴィジュネル鍵長推定
function estimateVigenereKeyLength(ciphertext, maxKeyLength = 20) {
  const normalized = normalize(ciphertext, true, true);
  
  if (normalized.length < 20) {
    throw new Error('暗号文が短すぎます（最低20文字必要）');
  }
  
  const results = [];
  
  // 鍵長1-maxKeyLengthを試行
  for (let keyLen = 1; keyLen <= Math.min(maxKeyLength, Math.floor(normalized.length / 3)); keyLen++) {
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
  
  return results;
}

// メッセージハンドラー
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'calcIC':
        const ic = calcIC(data.text);
        self.postMessage({
          type: 'calcIC_result',
          id,
          result: ic,
          success: true
        });
        break;
        
      case 'getCharCounts':
        const counts = getCharCounts(data.text);
        self.postMessage({
          type: 'getCharCounts_result',
          id,
          result: counts,
          success: true
        });
        break;
        
      case 'analyzeText':
        const processedText = normalize(data.rawText, data.keepAZ, data.removeSpaces);
        const textCounts = getCharCounts(processedText);
        const textIC = calcIC(processedText);
        
        self.postMessage({
          type: 'analyzeText_result',
          id,
          result: {
            processedText,
            counts: textCounts,
            ic: textIC,
            length: processedText.length
          },
          success: true
        });
        break;
        
      case 'monteCarloBatch':
        const batchResult = runMonteCarloBatch(
          data.text,
          data.batchSize,
          data.startTrial
        );
        
        self.postMessage({
          type: 'monteCarloBatch_result',
          id,
          result: batchResult,
          success: true
        });
        break;
        
      case 'estimateKeyLength':
        const keyLengthResults = estimateVigenereKeyLength(
          data.ciphertext,
          data.maxKeyLength
        );
        
        self.postMessage({
          type: 'estimateKeyLength_result',
          id,
          result: keyLengthResults,
          success: true
        });
        break;
        
      case 'normalize':
        const normalizedText = normalize(data.text, data.keepAZ, data.removeSpaces);
        self.postMessage({
          type: 'normalize_result',
          id,
          result: normalizedText,
          success: true
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: `${type}_result`,
      id,
      error: error.message,
      success: false
    });
  }
};

// Worker初期化完了通知
self.postMessage({
  type: 'worker_ready',
  message: 'IC Learning Visualizer Worker initialized'
});