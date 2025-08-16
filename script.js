// ---------- 定数 ----------
const AZ = [...Array(26)].map((_,i)=>String.fromCharCode(65+i));

// ---------- 前処理 ----------
function normalize(text, keepAZ=true, removeSpaces=true){
  let t = text.toUpperCase();
  if (removeSpaces) t = t.replace(/[\s\p{P}\p{S}]/gu, "");
  if (keepAZ) t = t.replace(/[^A-Z]/g, "");
  return t;
}

// ---------- 頻度計算 ----------
function freqCounts(text){
  const counts = Object.fromEntries(AZ.map(ch=>[ch,0]));
  for (const ch of text) if (counts.hasOwnProperty(ch)) counts[ch]++;
  const N = text.length;
  return {counts, N};
}

// ---------- IC, Σp_i^2 ----------
function calcIC(counts, N){
  if (N<=1) return {ic:0, sumNi:0, denom:0, sumPi2:0};
  let sumNi = 0;
  let sumPi2 = 0;
  for (const ch of AZ){
    const n = counts[ch]||0;
    sumNi += n*(n-1);
    const p = N>0 ? n/N : 0;
    sumPi2 += p*p;
  }
  const denom = N*(N-1);
  const ic = denom>0 ? sumNi/denom : 0;
  return {ic, sumNi, denom, sumPi2};
}

// ---------- 描画 ----------
function renderFreqChart(counts){
  const max = Math.max(1, ...AZ.map(ch => counts[ch]||0));
  const chart = document.getElementById("freqChart");
  chart.innerHTML = "";
  AZ.forEach(ch=>{
    const n = counts[ch]||0;
    const h = Math.round((n/max)*160);
    const div = document.createElement("div");
    div.className="bar";
    div.innerHTML = `
      <div class="col" style="height:${h}px"></div>
      <div class="cnt">${n}</div>
      <div class="lbl">${ch}</div>
    `;
    chart.appendChild(div);
  });
}

function setText(id, v){ document.getElementById(id).textContent = v; }
function setBadge(id, v, ok=true){
  const el = document.getElementById(id);
  el.textContent = v;
  el.style.color = ok ? "var(--accent2)" : "var(--danger)";
}

// ---------- サンプル ----------
function englishishSample(){
  return `
When in the course of human events it becomes necessary for one people to dissolve the political bands which have connected them with another,
and to assume among the powers of the earth, the separate and equal station to which the laws of nature and of nature's God entitle them,
a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.
`.trim();
}
function randomAZ(len=500){
  let s = "";
  for(let i=0;i<len;i++) s += String.fromCharCode(65 + Math.floor(Math.random()*26));
  return s;
}

// ---------- 計算フロー ----------
let currentText = "";

function doCalculate(){
  const raw = document.getElementById("inputText").value;
  const keepAZ = document.getElementById("normalizeAZ").checked;
  const rmSp = document.getElementById("removeSpaces").checked;

  const txt = normalize(raw, keepAZ, rmSp);
  currentText = txt;

  const {counts, N} = freqCounts(txt);
  const {ic, sumNi, denom, sumPi2} = calcIC(counts, N);

  setText("N", N);
  setText("sumNi", sumNi);
  setText("denom", denom);
  setBadge("IC", ic.toFixed(4), true);
  setText("sumPi2", sumPi2.toFixed(4));

  renderFreqChart(counts);
  resetMC(); // テキスト変更に伴いリセット
}

function loadSampleEnglish(){ document.getElementById("inputText").value = englishishSample(); doCalculate(); }
function loadSampleRandom(){ document.getElementById("inputText").value = randomAZ(500); doCalculate(); }

// ---------- モンテカルロ ----------
let mcTrials=0, mcHits=0, mcRunning=false, mcTarget=0;

function updateMCUI(lastIdxA=null,lastCharA=null,lastIdxB=null,lastCharB=null, matched=null){
  setText("mcTrials", mcTrials);
  setText("mcHits", mcHits);
  const rate = mcTrials>0 ? (mcHits/mcTrials) : 0;
  setText("mcRate", rate.toFixed(4));

  if (lastIdxA!=null){
    setText("idxA", lastIdxA);
    setText("charA", lastCharA);
    setText("idxB", lastIdxB);
    setText("charB", lastCharB);
    setBadge("match", matched ? "YES" : "NO", matched);
  }

  const prog = mcTarget>0 ? Math.min(100, Math.round((mcTrials%mcTarget)/mcTarget*100)) : 0;
  document.getElementById("progress").style.width = prog + "%";
}

function mcOnce(){
  if (currentText.length < 2) return;
  const N = currentText.length;
  let a = Math.floor(Math.random()*N);
  let b = Math.floor(Math.random()*N);
  if (a===b) b = (b+1)%N;

  const ca = currentText[a];
  const cb = currentText[b];
  const matched = (ca===cb);

  mcTrials++;
  if (matched) mcHits++;

  updateMCUI(a, ca, b, cb, matched);
}
function mcMany(k){ for(let i=0;i<k;i++) mcOnce(); }

function runMC(total){
  if (mcRunning) return;
  mcRunning = true;
  mcTarget = total;

  let done = 0;
  function step(){
    if (!mcRunning) return;
    const chunk = Math.min(500, total - done);
    mcMany(chunk);
    done += chunk;
    if (done >= total){
      mcRunning = false;
      updateMCUI();
      return;
    }
    updateMCUI();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function stopMC(){ mcRunning = false; }
function resetMC(){
  mcTrials=0; mcHits=0; mcTarget=0; mcRunning=false;
  updateMCUI(null,null,null,null,null);
  document.getElementById("progress").style.width = "0%";
  setText("idxA","-"); setText("charA","-");
  setText("idxB","-"); setText("charB","-");
  setBadge("match","-", true);
}

// ---------- 初期化 ----------
function boot(){
  document.getElementById("btnCalc").addEventListener("click", doCalculate);
  document.getElementById("btnSampleEnglish").addEventListener("click", loadSampleEnglish);
  document.getElementById("btnSampleRandom").addEventListener("click", loadSampleRandom);

  document.getElementById("btnOnce").addEventListener("click", ()=>{ mcOnce(); });
  document.getElementById("btn100").addEventListener("click", ()=>{ mcMany(100); updateMCUI(); });
  document.getElementById("btnRun").addEventListener("click", ()=>{
    const n = Math.max(1, parseInt(document.getElementById("trialCount").value||"2000",10));
    runMC(n);
  });
  document.getElementById("btnStop").addEventListener("click", stopMC);
  document.getElementById("btnReset").addEventListener("click", resetMC);

  // 初期サンプル
  document.getElementById("inputText").value = englishishSample();
  doCalculate();
}
window.addEventListener("DOMContentLoaded", boot);
