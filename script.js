
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
    document.getElementById("reading").textContent = "";
    updateProgressBar();
}

function answer(isCorrect) {
    if (isCorrect) {
        correct++;
    } else {
        missed.push(questions[current]);
    }
    const readingText = questions[current].reading;
    document.getElementById("reading").textContent = readingText;
    speak(readingText);
    setTimeout(() => {
        current++;
        showQuestion();
    }, 1500);
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
    // optional progress bar handling if needed
}


// 現在のテスト状態を保存する
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

// 保存された状態があれば復元する
function loadSavedProgress() {
    const saved = JSON.parse(localStorage.getItem("kanjiTestProgress"));
    if (saved) {
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
        return true;
    }
    return false;
}

// スタート時に保存された進行があれば継続するか確認
function startTest() {
    if (loadSavedProgress()) {
        if (!confirm("前回の途中から再開しますか？「キャンセル」を押すと新しく始めます。")) {
            localStorage.removeItem("kanjiTestProgress");
        } else {
            return;
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

// answer に保存追加
const originalAnswer = answer;
answer = function(isCorrect) {
    if (isCorrect) {
        correct++;
    } else {
        missed.push(questions[current]);
    }
    const readingText = questions[current].reading;
    document.getElementById("reading").textContent = readingText;
    speak(readingText);
    saveCurrentProgress();
    setTimeout(() => {
        current++;
        showQuestion();
    }, 1500);
}

// 完了時に保存データ削除
const originalShowResult = showResult;
showResult = function() {
    localStorage.removeItem("kanjiTestProgress");
    originalShowResult();
}


// フォントと色を読み込み、反映する
function applyFontAndColor() {
    const font = document.getElementById("font-select").value;
    const color = document.getElementById("color-picker").value;
    const kanjiElem = document.getElementById("kanji");
    const readingElem = document.getElementById("reading");
    kanjiElem.style.fontFamily = font;
    kanjiElem.style.color = color;
    readingElem.style.fontFamily = font;
    readingElem.style.color = "#34495e";
}

function showQuestion() {
    if (current >= questions.length) {
        showResult();
        return;
    }
    document.getElementById("kanji").textContent = questions[current].kanji;
    document.getElementById("reading").textContent = "";
    updateProgressBar();
    applyFontAndColor(); // フォントと色を適用
}
