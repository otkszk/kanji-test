
let questions = [];
let current = 0;
let correct = 0;
let missed = [];
let selectedVoice = null;
let speechRate = 1;

window.speechSynthesis.onvoiceschanged = () => {
    const voiceSelect = document.getElementById("voice-select");
    const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith("ja"));
    voiceSelect.innerHTML = "";
    voices.forEach(voice => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
    if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
        voiceSelect.value = voices[0].name;
    }
};

function startTest() {
    const saved = JSON.parse(localStorage.getItem("kanjiTestProgress"));
    if (saved) {
        if (confirm("前回の途中から再開しますか？")) {
            loadSavedProgress(saved);
            return;
        } else {
            localStorage.removeItem("kanjiTestProgress");
        }
    }

    const gradeSet = document.getElementById("grade-set").value;
    const mode = document.getElementById("mode").value;
    const voiceSelect = document.getElementById("voice-select");
    selectedVoice = speechSynthesis.getVoices().find(v => v.name === voiceSelect.value);
    speechRate = parseFloat(document.getElementById("rate").value);

    if (!gradeSet) {
        alert("学年とセットを選んでください");
        return;
    }

    fetch(`data/${gradeSet}.json`)
        .then(response => response.json())
        .then(data => {
            questions = data;
            if (mode === "random") {
                questions = shuffleArray(questions);
            } else if (mode === "review") {
                const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
                const last = history[history.length - 1];
                if (last) {
                    questions = last.missed.map(k => ({ kanji: k.kanji, reading: k.reading }));
                } else {
                    alert("復習モードの記録がありません");
                    return;
                }
            }
            current = 0;
            correct = 0;
            missed = [];
            document.getElementById("setup").style.display = "none";
            document.getElementById("quiz").style.display = "block";
            document.getElementById("result").style.display = "none";
            showQuestion();
        });
}

function loadSavedProgress(saved) {
    current = saved.current;
    correct = saved.correct;
    missed = saved.missed;
    questions = saved.questions;
    document.getElementById("test-date").value = saved.date || "";
    document.getElementById("grade-set").value = saved.gradeSet;
    document.getElementById("mode").value = saved.mode;
    document.getElementById("setup").style.display = "none";
    document.getElementById("quiz").style.display = "block";
    document.getElementById("result").style.display = "none";
    showQuestion();
}

function saveCurrentProgress() {
    const progress = {
        current,
        correct,
        missed,
        questions,
        gradeSet: document.getElementById("grade-set").value,
        mode: document.getElementById("mode").value,
        date: document.getElementById("test-date").value
    };
    localStorage.setItem("kanjiTestProgress", JSON.stringify(progress));
}

function showQuestion() {
    if (current >= questions.length) {
        showResult();
        return;
    }
    document.getElementById("kanji").textContent = questions[current].kanji;
    document.getElementById("reading").textContent = "";
    applyFontAndColor();
    updateProgressBar();
    setTimeout(() => {
        const readingText = questions[current].reading;
        document.getElementById("reading").textContent = readingText;
        speak(readingText);
    }, 2000);
}

function answer(isCorrect) {
    if (isCorrect) {
        correct++;
    } else {
        missed.push(questions[current]);
    }
    saveCurrentProgress();
    current++;
    showQuestion();
}

function interruptTest() {
    saveCurrentProgress();
    location.reload();
}

function updateProgressBar() {
    const percent = Math.round((current / questions.length) * 100);
    document.getElementById("progress-bar").value = percent;
}

function speak(text) {
    if (!selectedVoice) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = selectedVoice;
    utter.lang = "ja-JP";
    utter.rate = speechRate;
    speechSynthesis.speak(utter);
}

function applyFontAndColor() {
    const font = document.getElementById("font-select").value;
    const color = document.getElementById("color-picker").value;
    const kanjiElem = document.getElementById("kanji");
    const readingElem = document.getElementById("reading");
    kanjiElem.style.fontFamily = font;
    kanjiElem.style.color = color;
    readingElem.style.fontFamily = font;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showResult() {
    localStorage.removeItem("kanjiTestProgress");
    document.getElementById("quiz").style.display = "none";
    document.getElementById("result").style.display = "block";
    const score = Math.round((correct / questions.length) * 100);
    document.getElementById("score").textContent = `得点: ${score}点 (${correct}/${questions.length})`;
    document.getElementById("missed").textContent = missed.length > 0 ? "読めなかった漢字: " + missed.map(k => k.kanji).join(", ") : "すべて読めました！";
    showHistoryTable();
    showCurrentResultTable(score);
}

function showCurrentResultTable(score) {
    const date = document.getElementById("test-date").value;
    const gradeSet = document.getElementById("grade-set").value;
    const mode = document.getElementById("mode").value;
    const html = `
        <table border="1">
            <tr><th>実施日</th><th>学年</th><th>モード</th><th>点数</th><th>読めなかった漢字</th></tr>
            <tr><td>${date}</td><td>${gradeSet}</td><td>${mode}</td><td>${score}点</td><td>${missed.map(k => k.kanji).join(", ")}</td></tr>
        </table>`;
    document.getElementById("current-result-table").innerHTML = html;
}

function saveResult() {
    const date = document.getElementById("test-date").value;
    const gradeSet = document.getElementById("grade-set").value;
    const mode = document.getElementById("mode").value;
    const score = Math.round((correct / questions.length) * 100);
    const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
    history.push({ date, gradeSet, mode, score, missed });
    localStorage.setItem("kanjiTestHistory", JSON.stringify(history));
    alert("記録を保存しました");
}

function showHistory() {
    document.getElementById("setup").style.display = "none";
    document.getElementById("history").style.display = "block";
    const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
    const area = document.getElementById("history-list-table");
    if (!history.length) return;
    let html = "<table border='1'><tr><th>実施日</th><th>学年</th><th>モード</th><th>点数</th><th>読めなかった漢字</th></tr>";
    history.reverse().forEach(h => {
        html += `<tr><td>${h.date}</td><td>${h.gradeSet}</td><td>${h.mode}</td><td>${h.score}点</td><td>${h.missed.map(k => k.kanji).join(", ")}</td></tr>`;
    });
    html += "</table>";
    area.innerHTML = html;
}
