const { createApp } = Vue;

// 模擬 TOEIC 單字池 (實際開發建議放入 JSON 檔案)
const TOEIC_POOL = [
    { word: "Purchase", phonetic: "/ˈpɜːrtʃəs/", chinese: "購買", examples: ["Keep your receipt as proof of purchase.", "The land was a strategic purchase.", "You can purchase tickets online."] },
    { word: "Agenda", phonetic: "/əˈdʒendə/", chinese: "議程", examples: ["What's on the agenda for today?", "The committee set the agenda.", "Next item on the agenda is the budget."] },
    // ... 在此擴充更多單字
];

createApp({
    data() {
        return {
            currentTab: 'daily',
            dailyWords: [],
            wordBank: JSON.parse(localStorage.getItem('myWords') || '[]'),
            // 測驗相關
            quizWords: [],
            currentQuizIndex: 0,
            currentOptions: [],
            score: 0,
            quizFinished: false
        }
    },
    mounted() {
        this.generateDailyWords();
    },
    methods: {
        generateDailyWords() {
            // 從池子裡隨機抓 30 個 (範例池子不夠時會全抓)
            this.dailyWords = [...TOEIC_POOL].sort(() => 0.5 - Math.random()).slice(0, 30);
        },
        speak(text) {
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'en-US';
            window.speechSynthesis.speak(msg);
        },
        addToBank(word) {
            if (!this.isInBank(word.word)) {
                this.wordBank.push(word);
                localStorage.setItem('myWords', JSON.stringify(this.wordBank));
            }
        },
        isInBank(word) {
            return this.wordBank.some(w => w.word === word);
        },
        removeFromBank(index) {
            this.wordBank.splice(index, 1);
            localStorage.setItem('myWords', JSON.stringify(this.wordBank));
        },
        startQuiz() {
            this.currentTab = 'quiz';
            if (this.wordBank.length < 3) return;
            
            this.quizWords = [...this.wordBank].sort(() => 0.5 - Math.random()).slice(0, 50);
            this.currentQuizIndex = 0;
            this.score = 0;
            this.quizFinished = false;
            this.generateOptions();
        },
        generateOptions() {
            const correct = this.quizWords[this.currentQuizIndex].chinese;
            // 從所有池子抓錯誤選項
            let wrongOptions = TOEIC_POOL.map(w => w.chinese).filter(c => c !== correct);
            wrongOptions = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
            
            this.currentOptions = [correct, ...wrongOptions].sort(() => 0.5 - Math.random());
        },
        checkAnswer(selected) {
            const correct = this.quizWords[this.currentQuizIndex].chinese;
            if (selected === correct) {
                this.score += 2;
            }
            
            if (this.currentQuizIndex < this.quizWords.length - 1) {
                this.currentQuizIndex++;
                this.generateOptions();
            } else {
                this.quizFinished = true;
            }
        }
    }
}).mount('#app');
