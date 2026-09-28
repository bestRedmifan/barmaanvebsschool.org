const POSTS_URL = "posts.json";

const STORAGE_KEY = "barmaan_quiz_progress";
const TIMER_KEY = "barmaan_quiz_continue_timer";

let exams = [];

let currentExam = null;
let currentExamId = null;

let currentQuizIndex = 0;
let currentScore = 0;

let selectedOption = null;


// ===============================
// ELEMENTS
// ===============================

const examList = document.getElementById("examList");
const examsContainer = document.getElementById("exams");

const examPage = document.getElementById("examPage");

const examTitle = document.getElementById("examTitle");

const questionText =
    document.getElementById("questionText");

const optionsBox =
    document.getElementById("optionsBox");

const textAnswer =
    document.getElementById("textAnswer");

const submitButton =
    document.getElementById("submitButton");

const continueButton =
    document.getElementById("continueButton");

const backButton =
    document.getElementById("backButton");

const answerResult =
    document.getElementById("answerResult");

const quizNumber =
    document.getElementById("quizNumber");

const currentScoreElement =
    document.getElementById("currentScore");

const progressLabel =
    document.getElementById("progressLabel");

const progressBar =
    document.getElementById("progressBar");

const mediaBox =
    document.getElementById("mediaBox");

const examImage =
    document.getElementById("examImage");

const examVideo =
    document.getElementById("examVideo");

const examAudio =
    document.getElementById("examAudio");

const breakOverlay =
    document.getElementById("breakOverlay");

const closeBreak =
    document.getElementById("closeBreak");


// ===============================
// LOCAL STORAGE
// ===============================

function getSavedProgress() {

    try {

        return JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || {};

    } catch {

        return {};
    }
}


function saveProgress(data) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


// ===============================
// LOAD POSTS.JSON
// ===============================

async function loadExams() {

    try {

        const response =
            await fetch(POSTS_URL, {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(
                "posts.json failed"
            );
        }

        const data =
            await response.json();

        /*
         * posts.json can be:
         *
         * [
         *   {...},
         *   {...}
         * ]
         *
         * OR:
         *
         * {
         *   "posts": [...]
         * }
         */

        exams =
            Array.isArray(data)
                ? data
                : data.posts || [];

        /*
         * Only actual exam types are loaded.
         */
        exams =
            exams.filter(item => {

                return (
                    item.type === "Exam" ||
                    item.type === "Quiz" ||
                    Array.isArray(item.quizzes)
                );

            });

        renderExams();
        updateProgress();

    } catch (error) {

        console.error(error);

        examsContainer.innerHTML = `
            <div class="exam-card">
                <h3>Unable to load exams</h3>
                <p>Check posts.json.</p>
            </div>
        `;
    }
}


// ===============================
// EXAM HELPERS
// ===============================

function getExamId(exam, index) {

    return String(
        exam.id ||
        exam.examId ||
        `exam_${index}`
    );
}


function getExamTitle(exam, index) {

    return (
        exam.title ||
        exam.name ||
        `Exam ${index + 1}`
    );
}


function getQuizzes(exam) {

    let quizzes =
        Array.isArray(exam.quizzes)
            ? exam.quizzes
            : [];

    /*
     * Maximum 20 quizzes per exam.
     */
    return quizzes.slice(0, 20);
}


// ===============================
// RENDER EXAMS
// ===============================

function renderExams() {

    examsContainer.innerHTML = "";

    const progress =
        getSavedProgress();

    if (!exams.length) {

        examsContainer.innerHTML = `
            <div class="exam-card">
                <h3>No exams found</h3>
            </div>
        `;

        return;
    }

    exams.forEach((exam, index) => {

        const id =
            getExamId(exam, index);

        const title =
            getExamTitle(exam, index);

        const quizzes =
            getQuizzes(exam);

        const card =
            document.createElement("div");

        card.className = "exam-card";

        const titleElement =
            document.createElement("h3");

        titleElement.textContent = title;

        card.appendChild(titleElement);


        const typeElement =
            document.createElement("div");

        typeElement.className =
            "exam-type";

        typeElement.textContent =
            `${quizzes.length} quiz${quizzes.length === 1 ? "" : "zes"}`;

        card.appendChild(typeElement);


        /*
         * IMPORTANT:
         *
         * If this exam was already completed,
         * DO IT is NEVER shown again.
         */

        if (
            progress[id] &&
            progress[id].completed === true
        ) {

            const score =
                document.createElement("div");

            score.className =
                "exam-score";

            score.textContent =
                `Score: ${progress[id].score} / 20`;

            card.appendChild(score);

        } else {

            const button =
                document.createElement("button");

            button.className =
                "primary-button";

            button.textContent =
                "Do it";

            button.addEventListener(
                "click",
                () => {
                    startExam(exam, id);
                }
            );

            card.appendChild(button);
        }

        examsContainer.appendChild(card);
    });
}


// ===============================
// START EXAM
// ===============================

function startExam(exam, id) {

    const quizzes =
        getQuizzes(exam);

    if (!quizzes.length) {
        return;
    }

    currentExam = exam;
    currentExamId = id;

    currentQuizIndex = 0;
    currentScore = 0;
    selectedOption = null;

    examTitle.textContent =
        getExamTitle(
            exam,
            exams.indexOf(exam)
        );

    examList.classList.add("hidden");
    examPage.classList.remove("hidden");

    submitButton.classList.remove("hidden");

    continueButton.classList.add("hidden");

    submitButton.disabled = false;

    answerResult.textContent = "";

    showMedia(exam);

    renderQuiz();
}


// ===============================
// MEDIA
// ===============================

function showMedia(exam) {

    const media =
        exam.media || {};

    const image =
        media.image ||
        media.photo;

    const video =
        media.video;

    const audio =
        media.audio ||
        media.sound;

    examImage.classList.add("hidden");
    examVideo.classList.add("hidden");
    examAudio.classList.add("hidden");

    examImage.removeAttribute("src");
    examVideo.removeAttribute("src");
    examAudio.removeAttribute("src");

    if (image) {

        examImage.src = image;
        examImage.classList.remove("hidden");
    }

    if (video) {

        examVideo.src = video;
        examVideo.classList.remove("hidden");
    }

    if (audio) {

        examAudio.src = audio;
        examAudio.classList.remove("hidden");
    }

    if (image || video || audio) {

        mediaBox.classList.remove("hidden");

    } else {

        mediaBox.classList.add("hidden");
    }
}


// ===============================
// RENDER QUIZ
// ===============================

function renderQuiz() {

    const quizzes =
        getQuizzes(currentExam);

    if (
        currentQuizIndex >= quizzes.length
    ) {

        finishExam();

        return;
    }

    const quiz =
        quizzes[currentQuizIndex];

    selectedOption = null;

    quizNumber.textContent =
        `Quiz ${currentQuizIndex + 1} / ${quizzes.length}`;

    currentScoreElement.textContent =
        `Score: ${currentScore} / 20`;

    questionText.textContent =
        quiz.question ||
        quiz.text ||
        quiz.prompt ||
        "";

    answerResult.textContent = "";

    answerResult.className = "";

    optionsBox.innerHTML = "";

    textAnswer.value = "";

    optionsBox.classList.add("hidden");
    textAnswer.classList.add("hidden");


    // ===========================
    // OPTIONS
    // ===========================

    if (quiz.type === "Options") {

        optionsBox.classList.remove("hidden");

        let options =
            Array.isArray(quiz.options)
                ? quiz.options
                : [];

        /*
         * EXACTLY THREE OPTIONS.
         */
        options =
            options.slice(0, 3);

        options.forEach((option) => {

            const button =
                document.createElement("button");

            button.className =
                "option-button";

            button.textContent =
                String(option);

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".option-button"
                        )
                        .forEach(item => {
                            item.classList.remove(
                                "selected"
                            );
                        });

                    button.classList.add(
                        "selected"
                    );

                    selectedOption =
                        String(option);
                }
            );

            optionsBox.appendChild(button);
        });
    }


    // ===========================
    // TEXTING
    // ===========================

    if (quiz.type === "Texting") {

        textAnswer.classList.remove(
            "hidden"
        );

        textAnswer.focus();
    }

    submitButton.disabled = false;
}


// ===============================
// NORMALIZE TEXT
// ===============================

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();
}


// ===============================
// CHECK ANSWER
// ===============================

function isCorrect(quiz) {

    const correct =
        quiz.correctAnswer ??
        quiz.answer ??
        quiz.correct ??
        "";

    let userAnswer = "";

    if (quiz.type === "Options") {

        userAnswer =
            selectedOption || "";

    }

    if (quiz.type === "Texting") {

        userAnswer =
            textAnswer.value;
    }

    return (
        normalize(userAnswer) ===
        normalize(correct)
    );
}


// ===============================
// SUBMIT
// ===============================

submitButton.addEventListener(
    "click",
    () => {

        if (!currentExam) {
            return;
        }

        const quizzes =
            getQuizzes(currentExam);

        const quiz =
            quizzes[currentQuizIndex];

        /*
         * Texting cannot be empty.
         */
        if (
            quiz.type === "Texting" &&
            !textAnswer.value.trim()
        ) {

            answerResult.textContent =
                "Write an answer first.";

            answerResult.className =
                "wrong";

            return;
        }


        /*
         * Options must have a selection.
         */
        if (
            quiz.type === "Options" &&
            selectedOption === null
        ) {

            answerResult.textContent =
                "Choose an option first.";

            answerResult.className =
                "wrong";

            return;
        }


        const correct =
            isCorrect(quiz);


        if (correct) {

            /*
             * Every correct answer = 2 points.
             */
            currentScore += 2;

            /*
             * Maximum score = 20.
             */
            currentScore =
                Math.min(
                    currentScore,
                    20
                );

            answerResult.textContent =
                "Correct! +2 points";

            answerResult.className =
                "correct";

        } else {

            answerResult.textContent =
                "Incorrect.";

            answerResult.className =
                "wrong";
        }


        currentScoreElement.textContent =
            `Score: ${currentScore} / 20`;

        submitButton.disabled = true;


        /*
         * Move to next quiz.
         */
        setTimeout(() => {

            currentQuizIndex++;

            renderQuiz();

        }, 700);
    }
);


// ===============================
// FINISH EXAM
// ===============================

function finishExam() {

    currentScore =
        Math.min(
            currentScore,
            20
        );


    const progress =
        getSavedProgress();


    /*
     * Save EVERYTHING about this exam.
     */
    progress[currentExamId] = {

        completed: true,

        score: currentScore,

        completedAt: Date.now(),

        quizzes:
            getQuizzes(currentExam).length
    };


    saveProgress(progress);


    /*
     * Update global progress.
     */
    updateProgress();


    questionText.textContent =
        "Exam complete!";

    questionNumber = null;

    optionsBox.innerHTML = "";

    optionsBox.classList.add("hidden");

    textAnswer.classList.add("hidden");

    answerResult.textContent =
        `Final score: ${currentScore} / 20`;

    answerResult.className =
        "correct";


    submitButton.classList.add("hidden");


    /*
     * Continue starts grey.
     * Timer is saved in localStorage.
     */
    startContinueCooldown();


    /*
     * 20/20 = break message.
     */
    if (currentScore >= 20) {

        breakOverlay.classList.remove(
            "hidden"
        );
    }
}


// ===============================
// CONTINUE TIMER
// ===============================

function getTimerEnd() {

    const saved =
        localStorage.getItem(
            TIMER_KEY
        );

    if (!saved) {
        return 0;
    }

    const number =
        Number(saved);

    return Number.isFinite(number)
        ? number
        : 0;
}


function startContinueCooldown() {

    const FIVE_MINUTES =
        5 * 60 * 1000;

    const end =
        Date.now() +
        FIVE_MINUTES;


    localStorage.setItem(
        TIMER_KEY,
        String(end)
    );


    updateContinueButton(end);


    const timer =
        setInterval(() => {

            const currentEnd =
                getTimerEnd();

            updateContinueButton(
                currentEnd
            );


            if (
                currentEnd <=
                Date.now()
            ) {

                clearInterval(timer);
            }

        }, 1000);
}


function updateContinueButton(end) {

    const remaining =
        Math.max(
            0,
            end - Date.now()
        );


    if (remaining <= 0) {

        continueButton.disabled =
            false;

        continueButton.textContent =
            "Continue";

        return;
    }


    continueButton.disabled =
        true;


    const seconds =
        Math.ceil(
            remaining / 1000
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const sec =
        seconds % 60;


    continueButton.textContent =
        `Continue (${minutes}:${String(sec).padStart(2, "0")})`;
}


// ===============================
// CONTINUE
// ===============================

continueButton.addEventListener(
    "click",
    () => {

        const end =
            getTimerEnd();

        if (
            end > Date.now()
        ) {
            return;
        }

        showExamList();
    }
);


// ===============================
// BACK
// ===============================

backButton.addEventListener(
    "click",
    () => {

        showExamList();
    }
);


function showExamList() {

    currentExam = null;
    currentExamId = null;

    examPage.classList.add(
        "hidden"
    );

    examList.classList.remove(
        "hidden"
    );

    submitButton.classList.remove(
        "hidden"
    );

    continueButton.classList.add(
        "hidden"
    );

    renderExams();
}


// ===============================
// GLOBAL PROGRESS
// ===============================

function updateProgress() {

    const progress =
        getSavedProgress();

    let total = 0;


    Object.values(progress)
        .forEach(item => {

            if (
                item &&
                item.completed === true &&
                typeof item.score === "number"
            ) {

                total += item.score;
            }
        });


    /*
     * Global maximum = 20.
     */
    total =
        Math.min(
            total,
            20
        );


    progressLabel.textContent =
        `Progress: ${total} / 20`;


    progressBar.style.width =
        `${(total / 20) * 100}%`;
}


// ===============================
// BREAK MESSAGE
// ===============================

closeBreak.addEventListener(
    "click",
    () => {

        breakOverlay.classList.add(
            "hidden"
        );
    }
);


// ===============================
// RESTORE CONTINUE TIMER
// ===============================

function restoreTimer() {

    const end =
        getTimerEnd();


    if (
        end > Date.now()
    ) {

        continueButton.disabled =
            true;

        updateContinueButton(
            end
        );
    }
}


// ===============================
// START
// ===============================

restoreTimer();

loadExams();
