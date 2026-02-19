const { createApp } = Vue;

// 模擬從網路搜尋獲取的日常常用單字資料庫
const COMMON_WORDS_DATABASE = [
    { word: "Opportunity", phonetic: "/ˌɒpərˈtjuːnəti/", chinese: "機會", examples: ["Don't miss this opportunity.", "It's a great opportunity to learn.", "I had the opportunity to travel."], chinese_ex: ["不要錯過這個機會。", "這是學習的大好機會。", "我有機會去旅行。"] },
    { word: "Commute", phonetic: "/kəˈmjuːt/", chinese: "通勤", examples: ["My daily commute takes an hour.", "He commutes by train.", "I hate commuting in the rain."], chinese_ex: ["我每天通勤需要一小時。", "他搭火車通勤。", "我討厭在雨天通勤。"] },
    { word: "Collaborate", phonetic: "/kəˈlæbəreɪt/", chinese: "合作", examples: ["We need to collaborate on this.", "They collaborated with a famous artist.", "Let's collaborate to solve the problem."], chinese_ex: ["我們需要就此進行合作。", "他們與一位著名的藝術家合作。", "讓我們合作解決問題。"] },
    { word: "Appreciate", phonetic: "/əˈpriːʃieɪt/", chinese: "感激/欣賞", examples: ["I really appreciate your help.", "You should appreciate the beauty of nature.", "We appreciate your feedback."], chinese_ex: ["我真的很感激你的幫助。", "你應該欣賞大自然的美。", "我們感謝您的回饋。"] },
    { word: "Efficient", phonetic: "/ɪˈfɪʃnt/", chinese: "有效率的", examples: ["The new system is very efficient.", "She is an efficient worker.", "We need more efficient methods."], chinese_ex: ["新系統非常有效率。", "她是一位有效率的工作者。", "我們需要更有效率的方法。"] },
    { word: "Guarantee", phonetic: "/ˌɡærənˈtiː/", chinese: "保證", examples: ["I guarantee you will like it.", "There is no guarantee of success.", "The product has a two-year guarantee."], chinese_ex: ["我保證你會喜歡它。", "不保證會成功。", "該產品有兩年保固。"] },
    { word: "Potential", phonetic: "/pəˈtenʃl/", chinese: "潛力/潛在的", examples: ["He has great potential.", "The market has huge potential.", "Identify potential risks."], chinese_ex: ["他很有潛力。", "市場潛力巨大。", "識別潛在風險。"] },
    { word: "Flexible", phonetic: "/ˈfleksəbl/", chinese: "靈活的/有彈性的", examples: ["My schedule is very flexible.", "Rubber is a flexible material.", "We need a flexible approach."], chinese_ex: ["我的行程非常有彈性。", "橡膠是一種柔韌的材料。", "我們需要靈活的方法。"] },
    { word: "Relevant", phonetic: "/ˈreləvənt/", chinese: "相關的", examples: ["That's not relevant to the topic.", "Provide all relevant documents.", "Is this information relevant?"], chinese_ex: ["那與主題無關。", "提供所有相關文件。", "這項資訊相關嗎？"] },
    { word: "Significant", phonetic: "/sɪɡˈnɪfɪkənt/", chinese: "顯著的/重要的", examples: ["There is a significant difference.", "This is a significant discovery.", "A significant amount of time."], chinese_ex: ["有顯著的差異。", "這是一個重大的發現。", "大量的時間。"] },
    { word: "Analyze", phonetic: "/ˈænəlaɪz/", chinese: "分析", examples: ["We need to analyze the data.", "The blood samples are being analyzed.", "Analyze the results carefully."], chinese_ex: ["我們需要分析數據。", "血液樣本正在接受分析。", "仔細分析結果。"] },
    { word: "Challenge", phonetic: "/ˈtʃælɪndʒ/", chinese: "挑戰", examples: ["It was a difficult challenge.", "I love a good challenge.", "We face many challenges."], chinese_ex: ["這是一個艱難的挑戰。", "我喜歡挑戰。", "我們面臨許多挑戰。"] }
    // ... 可在此繼續加入更多日常單字
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
        this.refreshTenWords();
    },
    methods: {
        // --- 核心功能：刷新 10 個新單字 ---
        refreshTenWords() {
            // 從資料庫隨機取出 10 個
            const shuffled = [...COMMON_WORDS_DATABASE].sort(() => 0.5 - Math.random());
            this.dailyWords = shuffled.slice(0, 10);
            // 每次刷新滾動到頂部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        speak(text) {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'en-US';
            msg.rate = 0.9;
            window.speechSynthesis.speak(msg);
        },
        addToBank(word) {
            if (!this.isInBank(word.word)) {
                this.wordBank.push(JSON.parse(JSON.stringify(word)));
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
                alert("單字庫至少要有 3 個單字才能測驗！");
                return;
            }
            this.currentTab = 'quiz';
            this.quizWords = [...this.wordBank].sort(() => 0.5 - Math.random()).slice(0, 50);
            this.currentQuizIndex = 0;
            this.score = 0;
            this.quizFinished = false;
            this.generateOptions();
        },
        generateOptions() {
            const correct = this.quizWords[this.currentQuizIndex].chinese;
            let others = COMMON_WORDS_DATABASE.map(w => w.chinese).filter(c => c !== correct);
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
