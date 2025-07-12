
let questions = [];
let current = 0;
let correct = 0;
let missed = [];
let selectedVoice = null;
let speechRate = 1;

function startTest() {
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

function showQuestion() {
    if (current >= questions.length) {
        showResult();
        return;
    }
    document.getElementById("kanji").textContent = questions[current].kanji;
    updateProgressBar();
}

function answer(isCorrect) {
    if (isCorrect) {
        correct++;
    } else {
        missed.push(questions[current]);
    }
    speak(questions[current].reading);
    current++;
    showQuestion();
}

function showResult() {
    document.getElementById("quiz").style.display = "none";
    document.getElementById("result").style.display = "block";
    const score = Math.round((correct / questions.length) * 100);
    document.getElementById("score").textContent = `得点: ${score}点 (${correct}/${questions.length})`;
    document.getElementById("missed").textContent = missed.length > 0
        ? "読めなかった漢字: " + missed.map(k => k.kanji).join(", ")
        : "すべて読めました！";
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
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    history.forEach(h => {
        const li = document.createElement("li");
        li.textContent = `${h.date} - ${h.gradeSet} - ${h.mode} - ${h.score}点 - 読めなかった漢字: ${h.missed.map(k => k.kanji).join(", ")}`;
        list.appendChild(li);
    });
}

function speak(text) {
    if (!selectedVoice) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = selectedVoice;
    utter.lang = "ja-JP";
    utter.rate = speechRate;
    speechSynthesis.speak(utter);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateProgressBar() {
    const progress = document.getElementById("progress-bar");
    const percent = Math.round((current / questions.length) * 100);
    progress.value = percent;
}
