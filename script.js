const { createApp } = Vue;

const TOEIC_POOL = [
    { word: "Purchase", phonetic: "/ˈpɜːrtʃəs/", chinese: "購買", examples: ["Please keep your receipt as proof of purchase.", "The land was a strategic purchase.", "You can purchase tickets online."], chinese_ex: ["請保留收據作為購買憑證。", "這塊土地是一次戰略性的收購。", "你可以點擊網頁購買門票。"] },
    { word: "Agenda", phonetic: "/əˈdʒendə/", chinese: "議程", examples: ["What's on the agenda for today?", "The committee set the agenda.", "Next item on the agenda is the budget."], chinese_ex: ["今天的議程有哪些事項？", "委員會設定了議程。", "議程的下一個項目是預算。"] },
    { word: "Colleague", phonetic: "/ˈkɑːliːɡ/", chinese: "同事", examples: ["A colleague of mine is helping me.", "I’m going to lunch with my colleagues.", "She is a respected colleague."], chinese_ex: ["我的一位同事正在幫我。", "我要和我的同事們一起去吃午餐。", "她是一位受人尊敬的同事。"] },
    { word: "Inventory", phonetic: "/ˈɪnvəntɔːri/", chinese: "庫存/盤點", examples: ["We need to take an inventory.", "The inventory is checked every month.", "Reduce our inventory levels."], chinese_ex: ["我們需要進行盤點。", "庫存每個月都會檢查一次。", "降低我們的庫存水平。"] },
    { word: "Submit", phonetic: "/səbˈmɪt/", chinese: "提交/呈遞", examples: ["Submit your report by Friday.", "You must submit the application.", "I'll submit it to the manager."], chinese_ex: ["請在週五前提交你的報告。", "你必須提交申請。", "我會把它交給經理。"] }
];

createApp({
    data() {
        return {
            currentTab: 'daily',
            dailyWords: [],
            wordBank: JSON.parse(localStorage.getItem('myWords') || '[]'),
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
            this.dailyWords = [...TOEIC_POOL].sort(() => 0.5 - Math.random()).slice(0, 30);
        },
        getOneMoreWord() {
            const currentIds = this.dailyWords.map(w => w.word);
            const available = TOEIC_POOL.filter(w => !currentIds.includes(w.word));
            if (available.length > 0) {
                const newWord = available[Math.floor(Math.random() * available.length)];
                this.dailyWords.unshift(newWord);
            } else {
                alert("已無更多新單字！");
            }
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
        isInBank(wordName) {
            return this.wordBank.some(w => w.word === wordName);
        },
        removeFromBank(index) {
            this.wordBank.splice(index, 1);
            localStorage.setItem('myWords', JSON.stringify(this.wordBank));
        },
        startQuiz() {
            if (this.wordBank.length < 3) {
                this.currentTab = 'quiz';
                this.quizWords = [];
                return;
            }
            this.quizWords = [...this.wordBank].sort(() => 0.5 - Math.random()).slice(0, 50);
            this.currentQuizIndex = 0;
            this.score = 0;
            this.quizFinished = false;
            this.currentTab = 'quiz';
            this.generateOptions();
        },
        generateOptions() {
            const correct = this.quizWords[this.currentQuizIndex].chinese;
            let others = TOEIC_POOL.map(w => w.chinese).filter(c => c !== correct);
            others = [...new Set(others)].sort(() => 0.5 - Math.random()).slice(0, 2);
            this.currentOptions = [correct, ...others].sort(() => 0.5 - Math.random());
        },
        checkAnswer(ans) {
            if (ans === this.quizWords[this.currentQuizIndex].chinese) {
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
