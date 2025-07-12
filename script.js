
let kanjiList = [];
let currentIndex = 0;
let correctCount = 0;
let missedList = [];
let selectedVoice = null;
let speechRate = 1;

function startTest() {
    const gradeSet = document.getElementById("grade-set").value;
    const mode = document.getElementById("mode").value;
    const date = document.getElementById("test-date").value;
    if (!gradeSet || !date) {
        alert("検査日と学年セットを選んでください");
        return;
    }

    fetch(`data/${gradeSet}.json`)
        .then(response => response.json())
        .then(data => {
            kanjiList = data;
            if (mode === "random") {
                kanjiList = shuffleArray(kanjiList);
            } else if (mode === "review") {
                const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
                const last = history[history.length - 1];
                if (last && last.missed.length > 0) {
                    kanjiList = last.missed.map(item => ({ kanji: item.kanji, answer: item.answer }));
                } else {
                    alert("復習する漢字がありません");
                    return;
                }
            }
            currentIndex = 0;
            correctCount = 0;
            missedList = [];
            document.getElementById("setup").style.display = "none";
            document.getElementById("quiz").style.display = "block";
            showQuestion();
        });
}

function showQuestion() {
    if (currentIndex >= kanjiList.length) {
        showResult();
        return;
    }
    document.getElementById("kanji").textContent = kanjiList[currentIndex].kanji;
}

function answer(isCorrect) {
    const item = kanjiList[currentIndex];
    if (isCorrect) {
        correctCount++;
    } else {
        missedList.push(item);
    }
    speak(item.answer);
    currentIndex++;
    setTimeout(showQuestion, 800);
}

function showResult() {
    document.getElementById("quiz").style.display = "none";
    document.getElementById("result").style.display = "block";
    const score = Math.round((correctCount / kanjiList.length) * 100);
    document.getElementById("score").textContent = `得点: ${score}点（${correctCount} / ${kanjiList.length}）`;
    document.getElementById("missed").textContent = missedList.length > 0
        ? "読めなかった漢字: " + missedList.map(item => item.kanji).join(", ")
        : "すべて読めました！";
}

function saveResult() {
    const date = document.getElementById("test-date").value;
    const gradeSet = document.getElementById("grade-set").value;
    const mode = document.getElementById("mode").value;
    const score = Math.round((correctCount / kanjiList.length) * 100);
    const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
    history.push({
        date, gradeSet, mode, score,
        missed: missedList
    });
    localStorage.setItem("kanjiTestHistory", JSON.stringify(history));
    alert("記録を保存しました");
}

function showHistory() {
    document.getElementById("setup").style.display = "none";
    document.getElementById("history").style.display = "block";
    const history = JSON.parse(localStorage.getItem("kanjiTestHistory") || "[]");
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    history.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.date} - ${entry.gradeSet} - ${entry.mode} - ${entry.score}点 - 読めなかった漢字: ${entry.missed.map(m => m.kanji).join(", ")}`;
        list.appendChild(li);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function speak(text) {
    if (!selectedVoice) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = speechRate;
    utterance.lang = "ja-JP";
    speechSynthesis.speak(utterance);
}

function populateVoices() {
    const voiceSelect = document.getElementById("voice-select");
    const voices = speechSynthesis.getVoices().filter(v => v.lang === "ja-JP");
    voiceSelect.innerHTML = "";
    voices.forEach((voice, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = voice.name;
        voiceSelect.appendChild(option);
    });
    voiceSelect.onchange = () => {
        selectedVoice = voices[voiceSelect.value];
    };
    if (voices.length > 0) {
        selectedVoice = voices[0];
    }
}

document.getElementById("rate").oninput = function () {
    speechRate = parseFloat(this.value);
};

window.speechSynthesis.onvoiceschanged = populateVoices;
window.onload = populateVoices;
