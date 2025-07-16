let questions=[], current=0, correct=0, missed=[];
function startTest() {
    document.getElementById("setup").style.display="none";
    document.getElementById("quiz").style.display="block";
    questions=[{kanji:"日",reading:"にち"},{kanji:"月",reading:"げつ"}];
    current=0; correct=0; missed=[]; showQuestion();
}
function showQuestion() {
    if (current >= questions.length) return showResult();
    document.getElementById("kanji").textContent = questions[current].kanji;
    document.getElementById("reading").textContent = "";
    setTimeout(() => {
        document.getElementById("reading").textContent = questions[current].reading;
        speak(questions[current].reading);
    }, getDelay());
    updateProgress();
}
function answer(ok) {
    if (!ok) missed.push(questions[current]);
    else correct++;
    current++; showQuestion();
}
function updateProgress() {
    document.getElementById("progress-bar").value = 100 * current / questions.length;
}
function speak(txt) {
    let ut = new SpeechSynthesisUtterance(txt);
    ut.lang = "ja-JP"; speechSynthesis.speak(ut);
}
function getDelay() {
    const lv = document.getElementById("level").value;
    return lv==="easy"?3000:lv==="hard"?1000:2000;
}
function showResult() {
    document.getElementById("quiz").style.display="none";
    document.getElementById("result").style.display="block";
    document.getElementById("score").textContent = `正解数: ${correct}/${questions.length}`;
    document.getElementById("missed").textContent = "×: " + missed.map(q=>q.kanji).join(",");
}
function interruptTest() {
    location.reload();
}
function saveResult() { alert("保存されました"); }
