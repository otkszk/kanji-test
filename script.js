let questions = [];
let currentIndex = 0;
let correctCount = 0;
let missedQuestions = [];
let delayMs = 2000;
let selectedVoice = null;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function startTest() {
  // ==== iOS用 初回音声再生の許可 ====
  try {
    const dummyUtterance = new SpeechSynthesisUtterance("テストを開始します");
    dummyUtterance.lang = "ja-JP";
    speechSynthesis.speak(dummyUtterance);
  } catch (e) {
    console.warn("音声初期化エラー:", e);
  }
  // =================================

  const level = document.getElementById("level").value;
  delayMs = level === "easy" ? 3000 : level === "hard" ? 1000 : 2000;

  const gradeKey = document.getElementById("grade-set").value;
  questions = questionSets[gradeKey] || [];

  if (questions.length === 0) {
    alert("問題が見つかりません。");
    return;
  }

  currentIndex = 0;
  correctCount = 0;
  missedQuestions = [];

  document.getElementById("setup").style.display = "none";
  document.getElementById("quiz").style.display = "block";

  showQuestion();
}


  const question = questions[currentIndex];
  const kanjiElem = document.getElementById("kanji");
  const readingElem = document.getElementById("reading");

  const font = document.getElementById("font-select").value;
  const color = document.getElementById("color-picker").value;
  kanjiElem.style.fontFamily = font;
  kanjiElem.style.color = color;
  kanjiElem.style.fontSize = "6em";
  readingElem.style.fontSize = "2em";

  kanjiElem.textContent = question.kanji;
  readingElem.textContent = "";

  setTimeout(() => {
    readingElem.textContent = question.reading;
    speak(question.reading);
  }, delayMs);

  updateProgress();
}

function answer(isCorrect) {
  if (!isCorrect) missedQuestions.push(questions[currentIndex]);
  else correctCount++;
  currentIndex++;
  showQuestion();
}

function updateProgress() {
  const progress = document.getElementById("progress-bar");
  progress.value = ((currentIndex) / questions.length) * 100;
  document.getElementById("progress-text").textContent = `${currentIndex} / ${questions.length}`;
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = parseFloat(document.getElementById("rate").value);
  if (selectedVoice) utterance.voice = selectedVoice;
  speechSynthesis.speak(utterance);
}

// ✅ 「やめる」ボタン → 初期画面へ戻す
function cancelTest() {
  questions = [];
  currentIndex = 0;
  correctCount = 0;
  missedQuestions = [];

  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "none";
  document.getElementById("history").style.display = "none";
  document.getElementById("setup").style.display = "block";
}

function showResult() {
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "block";

  const scoreText = `正解数: ${correctCount} / ${questions.length}`;
  document.getElementById("score").textContent = scoreText;

  const missed = missedQuestions.map(q => q.kanji).join(", ");
  const missedElem = document.getElementById("missed");

  if (correctCount === questions.length) {
    missedElem.textContent = "🎉 全問正解おめでとうございます！ 🎉";
  } else {
    missedElem.textContent = missed ? "読めなかった漢字: " + missed : "すべて読めました！";
  }

  const date = document.getElementById("test-date").value;
  const grade = document.getElementById("grade-set").value;
  const mode = document.getElementById("mode").value;

  const currentTable = `
    <table>
      <tr><th>実施日</th><th>学年</th><th>モード</th><th>点数</th><th>読めなかった漢字</th></tr>
      <tr><td>${date}</td><td>${grade}</td><td>${mode}</td><td>${correctCount}/${questions.length}</td><td>${missed}</td></tr>
    </table>
  `;
  document.getElementById("current-result-table").innerHTML = currentTable;
  saveResult();
}

function saveResult() {
  const date = document.getElementById("test-date").value;
  const grade = document.getElementById("grade-set").value;
  const mode = document.getElementById("mode").value;
  const missed = missedQuestions.map(q => q.kanji);
  const score = `${correctCount}/${questions.length}`;
  const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
  history.push({ date, gradeSet: grade, mode, score, missed });
  localStorage.setItem("kanjiTestHistory", JSON.stringify(history));
}

function showHistory() {
  document.getElementById("setup").style.display = "none";
  document.getElementById("history").style.display = "block";

  const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
  let html = "<table><tr><th>実施日</th><th>学年</th><th>モード</th><th>点数</th><th>読めなかった漢字</th></tr>";
  for (const record of history.reverse()) {
    html += `<tr><td>${record.date}</td><td>${record.gradeSet}</td><td>${record.mode}</td><td>${record.score}</td><td>${record.missed.join(", ")}</td></tr>`;
  }
  html += "</table>";
  document.getElementById("history-list-table").innerHTML = html;
}

window.addEventListener("load", () => {
  const dateInput = document.getElementById("test-date");
  dateInput.value = new Date().toISOString().split("T")[0];

  function loadVoices() {
    const voiceSelect = document.getElementById("voice-select");
    voiceSelect.innerHTML = "";

    let japaneseVoices = speechSynthesis.getVoices()
      .filter(v => v.lang && v.lang.startsWith("ja"));

    // 最大5件に制限
    japaneseVoices = japaneseVoices.slice(0, 5);

    if (japaneseVoices.length > 0) {
      japaneseVoices.forEach(v => {
        const option = document.createElement("option");
        option.value = v.name;
        option.textContent = `${v.name} (${v.lang})`;
        voiceSelect.appendChild(option);
      });
    } else {
      // 日本語音声が取得できないときのフォールバック
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "日本語音声が見つかりません";
      voiceSelect.appendChild(option);
    }
  }

  // ページロード直後に少し遅延して読み込み
  setTimeout(loadVoices, 500);

  // イベントでの再読み込み
  if (typeof speechSynthesis !== "undefined") {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
});
