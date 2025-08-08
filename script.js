let questions = [];
let currentIndex = 0;
let correctCount = 0;
let missedQuestions = [];
let delayMs = 2000;

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function startTest() {
  const grade = document.getElementById("grade-set").value;
  const mode = document.getElementById("mode").value;
  const voiceSelect = document.getElementById("voice-select");
  const selectedVoiceName = voiceSelect.value;
  const voices = speechSynthesis.getVoices();
  selectedVoice = voices.find(v => v.name === selectedVoiceName);

  if (!grade) {
    alert("学年とセットを選んでください");
    return;
  }

  fetch(`data/${grade}.json`)
    .then(res => {
      if (!res.ok) throw new Error("データの読み込みに失敗しました");
      return res.json();
    })
    .then(data => {
      if (mode === "ten") {
        questions = shuffle(data).slice(0, 10);
      } else if (mode === "random") {
        questions = shuffle(data);
      } else if (mode === "review") {
        const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
        const last = history[history.length - 1];
        if (last && last.missed && last.missed.length > 0) {
          questions = last.missed.map(k => ({ kanji: k.kanji, reading: k.reading }));
        } else {
          alert("復習モードの記録がありません");
          return;
        }
      } else {
        questions = data;
      }

      currentIndex = 0;
      correctCount = 0;
      missedQuestions = [];

      document.getElementById("setup").style.display = "none";
      document.getElementById("quiz").style.display = "block";
      showQuestion();
    })
    .catch(err => {
      alert("エラーが発生しました: " + err.message);
    });
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    showResult();
    return;
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
  const selectedVoiceName = document.getElementById("voice-select").value;
  const selectedVoice = speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
  if (selectedVoice) utterance.voice = selectedVoice;
  speechSynthesis.speak(utterance);
}

function interruptTest() {
  if (confirm("中断して最初の画面に戻りますか？")) {
    location.reload();
  }
}

function showResult() {
  document.getElementById("quiz").style.display = "none";
  document.getElementById("result").style.display = "block";

  const scoreText = `正解数: ${correctCount} / ${questions.length}`;
  document.getElementById("score").textContent = scoreText;
  const missed = missedQuestions.map(q => q.kanji).join(", ");
  document.getElementById("missed").textContent = missed ? "読めなかった漢字: " + missed : "すべて読めました！";

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
