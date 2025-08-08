let questions = [];
let currentIndex = 0;
let correctCount = 0;
let missedQuestions = [];
let delayMs = 2000;

import json
import random

# Load the script file
with open("script.js", "r", encoding="utf-8") as f:
    script_lines = f.readlines()

# Modify the startTest function to implement "10問テストモード"
modified_lines = []
in_start_test = False
for line in script_lines:
    stripped = line.strip()
    if stripped.startswith("function startTest()"):
        in_start_test = True
    if in_start_test and stripped.startswith("questions = ["):
        # Replace the hardcoded questions with fetch logic
        modified_lines.append("  const mode = document.getElementById(\"mode\").value;\n")
        modified_lines.append("  const grade = document.getElementById(\"grade-set\").value;\n")
        modified_lines.append("  fetch(`data/${grade}.json`)\n")
        modified_lines.append("    .then(res => res.json())\n")
        modified_lines.append("    .then(data => {\n")
        modified_lines.append("      if (mode === \"ten\") {\n")
        modified_lines.append("        questions = data.sort(() => 0.5 - Math.random()).slice(0, 10);\n")
        modified_lines.append("      } else {\n")
        modified_lines.append("        questions = data;\n")
        modified_lines.append("      }\n")
        modified_lines.append("      currentIndex = 0;\n")
        modified_lines.append("      correctCount = 0;\n")
        modified_lines.append("      missedQuestions = [];\n")
        modified_lines.append("      document.getElementById(\"setup\").style.display = \"none\";\n")
        modified_lines.append("      document.getElementById(\"quiz\").style.display = \"block\";\n")
        modified_lines.append("      showQuestion();\n")
        modified_lines.append("    });\n")
        in_start_test = False
        continue
    if in_start_test and stripped.startswith("currentIndex = 0;"):
        continue  # skip original initialization
    if in_start_test and stripped.startswith("correctCount = 0;"):
        continue
    if in_start_test and stripped.startswith("missedQuestions = [];"):
        continue
    if in_start_test and stripped.startswith("document.getElementById(\"setup\")"):
        continue
    if in_start_test and stripped.startswith("document.getElementById(\"quiz\")"):
        continue
    if in_start_test and stripped.startswith("showQuestion();"):
        continue
    modified_lines.append(line)

# Modify updateProgress to ensure progress bar reflects 10 questions
new_script = []
for line in modified_lines:
    if "progress.value =" in line:
        new_script.append("  progress.max = questions.length;\n")
        new_script.append("  progress.value = currentIndex;\n")
    else:
        new_script.append(line)

# Save the modified script
with open("script 1_modified.js", "w", encoding="utf-8") as f:
    f.writelines(new_script)

print("script 1.js has been modified and saved as script 1_modified.js with 10問テストモード implemented.")


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
