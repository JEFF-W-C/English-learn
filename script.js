const { createApp } = Vue;

// 單字池範例（請確保每個單字都有 chinese_ex，且長度與 examples 相同）
const TOEIC_POOL = [
    { 
        word: "Purchase", 
        phonetic: "/ˈpɜːrtʃəs/", 
        chinese: "購買", 
        examples: [
            "Keep your receipt as proof of purchase.", 
            "The land was a strategic purchase.", 
            "You can purchase tickets online."
        ],
        chinese_ex: [
            "請保留收據作為購買憑證。",
            "這塊土地是一次戰略性收購。",
            "你可以點擊網頁購買門票。"
        ]
    },
    { 
        word: "Agenda", 
        phonetic: "/əˈdʒendə/", 
        chinese: "議程", 
        examples: [
            "What's on the agenda for today?", 
            "The committee set the agenda.", 
            "Next item on the agenda is the budget."
        ],
        chinese_ex: [
            "今天的議程有哪些事項？",
            "委員會設定了議程。",
            "議程的下一個項目是預算。"
        ]
    }
    // 您可以在此繼續手動新增更多單字...
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
            // 初始隨機抓取 30 個
            this.dailyWords = [...TOEIC_POOL].sort(() => 0.5 - Math.random()).slice(0, 30);
        },
        // --- 新增功能：獲取一個新單字 ---
        getOneMoreWord() {
            // 過濾掉目前畫面上已經有的單字
            const existingWords = this.dailyWords.map(w => w.word);
            const availableWords = TOEIC_POOL.filter(w => !existingWords.includes(w.word));

            if (availableWords.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableWords.length);
                // 將新單字加入到列表的最前面
                this.dailyWords.unshift(availableWords[randomIndex]);
            } else {
                alert("單字池中沒有更多新單字了！");
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
            let wrongOptions = TOEIC_POOL.map(w => w.chinese).filter(c => c !== correct);
            // 去除重複的中文意思
            wrongOptions = [...new Set(wrongOptions)];
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
