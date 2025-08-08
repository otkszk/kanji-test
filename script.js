let questions = [];
let currentIndex = 0;
let correctCount = 0;
let missedQuestions = [];
let delayMs = 2000;


function startTest() {
    const dateInput = document.getElementById("test-date");
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    const level = document.getElementById("level").value;
    if (level === "easy") delayMs = 3000;
    else if (level === "normal") delayMs = 2000;
    else delayMs = 1000;

    const mode = document.getElementById("mode").value;
    const grade = document.getElementById("grade-set").value;

    let allQuestions = [
        { kanji: "日", reading: "にち" },
        { kanji: "月", reading: "げつ" },
        { kanji: "火", reading: "か" },
        { kanji: "水", reading: "すい" },
        { kanji: "木", reading: "もく" },
        { kanji: "金", reading: "きん" },
        { kanji: "土", reading: "ど" },
        { kanji: "山", reading: "やま" },
        { kanji: "川", reading: "かわ" },
        { kanji: "田", reading: "た" },
        { kanji: "空", reading: "そら" },
        { kanji: "雨", reading: "あめ" },
        { kanji: "風", reading: "かぜ" }
    ];

    if (mode === "test10") {
        questions = shuffleArray(allQuestions).slice(0, 10);
    } else {
        questions = allQuestions;
    }

    currentIndex = 0;
    correctCount = 0;
    missedQuestions = [];

    document.getElementById("setup").style.display = "none";
    document.getElementById("quiz").style.display = "block";
    showQuestion();
}

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}


function showQuestion() {
  if (currentIndex >= questions.length) {
    showResult();
    return;
  }

  const question = questions[currentIndex];
  const kanjiElem = document.getElementById("kanji");
  const readingElem = document.getElementById("reading");

  // フォント・色反映
  const font = document.getElementById("font-select").value;
  const color = document.getElementById("color-picker").value;
  kanjiElem.style.fontFamily = font;
  kanjiElem.style.color = color;
  kanjiElem.style.fontSize = "6em";
  readingElem.style.fontSize = "2em";

  // 表示
  kanjiElem.textContent = question.kanji;
  readingElem.textContent = "";

  // delay後に表示＆音声
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

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = parseFloat(document.getElementById("rate").value);
  const selectedVoiceName = document.getElementById("voice-select").value;
  const selectedVoice = speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
  if (selectedVoice) utterance.voice = selectedVoice;
  speechSynthesis.speak(utterance);
}

function updateProgress() {
  const progress = document.getElementById("progress-bar");
  progress.value = ((currentIndex) / questions.length) * 100;
}

function showResult() {
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "block";
  document.getElementById("score").textContent =
    `正解数: ${correctCount} / ${questions.length}`;

  const missed = missedQuestions.map(q => q.kanji).join(", ");
  document.getElementById("missed").textContent = "読めなかった漢字: " + missed;

  const date = document.getElementById("test-date").value;
  const grade = document.getElementById("grade-set").value;
  const mode = document.getElementById("mode").value;
  const score = `${correctCount}/${questions.length}`;

  const currentTable = `
    <table>
      <tr><th>実施日</th><th>学年</th><th>モード</th><th>点数</th><th>読めなかった漢字</th></tr>
      <tr><td>${date}</td><td>${grade}</td><td>${mode}</td><td>${score}</td><td>${missed}</td></tr>
    </table>
  `;
  document.getElementById("current-result-table").innerHTML = currentTable;
}

function interruptTest() {
  if (confirm("中断して最初の画面に戻りますか？")) {
    location.reload();
  }
}

function saveResult() {
  const history = JSON.parse(localStorage.getItem("kanji_history") || "[]");
  const date = document.getElementById("test-date").value;
  const grade = document.getElementById("grade-set").value;
  const mode = document.getElementById("mode").value;
  const score = `${correctCount}/${questions.length}`;
  const missed = missedQuestions.map(q => q.kanji).join(", ");
  history.push({ date, grade, mode, score, missed });
  localStorage.setItem("kanji_history", JSON.stringify(history));
  alert("記録を保存しました");
}

function showHistory() {
  document.getElementById("setup").style.display = "none";
  document.getElementById("history").style.display = "block";

  const history = JSON.parse(localStorage.getItem("kanji_history") || "[]");
  let html = "<table><tr><th>実施日</th><th>学年</th><th>モード</th><th>点数</th><th>読めなかった漢字</th></tr>";
  for (const record of history) {
    html += `<tr><td>${record.date}</td><td>${record.grade}</td><td>${record.mode}</td><td>${record.score}</td><td>${record.missed}</td></tr>`;
  }
  html += "</table>";
  document.getElementById("history-list-table").innerHTML = html;
}

window.addEventListener("load", () => {
  // 日付初期化
  const dateInput = document.getElementById("test-date");
  dateInput.value = new Date().toISOString().split("T")[0];

  // 音声読み上げの初期化
  const voiceSelect = document.getElementById("voice-select");
  function loadVoices() {
    voiceSelect.innerHTML = "";
    speechSynthesis.getVoices().forEach(voice => {
      const option = document.createElement("option");
      option.value = voice.name;
      option.textContent = voice.name;
      voiceSelect.appendChild(option);
    });
  }
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
});
