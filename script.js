const { createApp } = Vue;

// 擴充單字池：包含拼音、中文、例句及翻譯
const TOEIC_POOL = [
    { word: "Purchase", phonetic: "/ˈpɜːrtʃəs/", chinese: "購買", examples: ["Keep your receipt as proof of purchase.", "The land was a strategic purchase.", "You can purchase tickets online."], chinese_ex: ["請保留收據作為購買憑證。", "這塊土地是一次戰略性的收購。", "你可以點擊網頁購買門票。"] },
    { word: "Agenda", phonetic: "/əˈdʒendə/", chinese: "議程", examples: ["What's on the agenda for today?", "The committee set the agenda.", "Next item on the agenda is the budget."], chinese_ex: ["今天的議程有哪些事項？", "委員會設定了議程。", "議程的下一個項目是預算。"] },
    { word: "Colleague", phonetic: "/ˈkɑːliːɡ/", chinese: "同事", examples: ["A colleague of mine is helping me.", "I’m going to lunch with my colleagues.", "She is a respected colleague."], chinese_ex: ["我的一位同事正在幫我。", "我要和我的同事們一起去吃午餐。", "她是一位受人尊敬的同事。"] },
    { word: "Inventory", phonetic: "/ˈɪnvəntɔːri/", chinese: "庫存/盤點", examples: ["We need to take an inventory.", "The inventory is checked every month.", "Reduce our inventory levels."], chinese_ex: ["我們需要進行盤點。", "庫存每個月都會檢查一次。", "降低我們的庫存水平。"] },
    { word: "Submit", phonetic: "/səbˈmɪt/", chinese: "提交/呈遞", examples: ["Submit your report by Friday.", "You must submit the application.", "I'll submit it to the manager."], chinese_ex: ["請在週五前提交你的報告。", "你必須提交申請。", "我會把它交給經理。"] },
    { word: "Contract", phonetic: "/ˈkɑːntrækt/", chinese: "合約", examples: ["Please sign the contract.", "The contract expires next month.", "We need to renew the contract."], chinese_ex: ["請在合約上簽名。", "合約將於下個月到期。", "我們需要續約。"] },
    { word: "Negotiate", phonetic: "/nɪˈɡoʊʃieɪt/", chinese: "談判/協商", examples: ["We need to negotiate a deal.", "They are negotiating the terms.", "I'm trying to negotiate a higher salary."], chinese_ex: ["我們需要商談一筆交易。", "他們正在協商條款。", "我正試著洽談更高的薪水。"] },
    { word: "Postpone", phonetic: "/poʊstˈpoʊn/", chinese: "延期", examples: ["The meeting was postponed.", "We have to postpone the trip.", "Never postpone until tomorrow."], chinese_ex: ["會議被延期了。", "我們必須推遲旅行。", "永遠不要拖延到明天。"] },
    { word: "Candidate", phonetic: "/ˈkændɪdət/", chinese: "候選人", examples: ["He is a strong candidate.", "We interviewed five candidates.", "The candidate has great experience."], chinese_ex: ["他是一位很強的候選人。", "我們面試了五位候選人。", "這位候選人經驗豐富。"] },
    { word: "Efficiency", phonetic: "/ɪˈfɪʃnsi/", chinese: "效率", examples: ["We need to improve efficiency.", "Energy efficiency is important.", "The new system increased efficiency."], chinese_ex: ["我們需要提高效率。", "節能效率很重要。", "新系統提高了效率。"] }
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
        // 初始化時，隨機抓取最多 30 個單字顯示
        this.initDailyWords();
    },
    methods: {
        initDailyWords() {
            const count = Math.min(30, TOEIC_POOL.length);
            this.dailyWords = [...TOEIC_POOL].sort(() => 0.5 - Math.random()).slice(0, count);
        },
        getOneMoreWord() {
            const currentWords = this.dailyWords.map(w => w.word);
            const available = TOEIC_POOL.filter(w => !currentWords.includes(w.word));
            
            if (available.length > 0) {
                const newWord = available[Math.floor(Math.random() * available.length)];
                // 確保 Vue 響應式更新：建立新陣列
                this.dailyWords = [newWord, ...this.dailyWords];
            } else {
                alert("單字池已空，沒有更多新單字了！");
            }
        },
        speak(text) {
            // 先停止所有正在播放的聲音，避免卡死
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'en-US';
            msg.rate = 0.9; // 稍微放慢一點點
            window.speechSynthesis.speak(msg);
        },
        addToBank(word) {
            if (!this.isInBank(word.word)) {
                // 深拷貝物件，避免頁籤切換時的資料衝突
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
                alert("單字庫至少要有 3 個單字才能開始測驗！");
                this.currentTab = 'bank';
                return;
            }
            // 從單字庫隨機抓取最多 50 個單字進行測驗
            this.quizWords = [...this.wordBank].sort(() => 0.5 - Math.random()).slice(0, 50);
            this.currentQuizIndex = 0;
            this.score = 0;
            this.quizFinished = false;
            this.currentTab = 'quiz';
            this.generateOptions();
        },
        generateOptions() {
            if (!this.quizWords[this.currentQuizIndex]) return;
            const correct = this.quizWords[this.currentQuizIndex].chinese;
            
            // 從總單字池抓取中文意思作為錯誤干擾項
            let poolChinese = TOEIC_POOL.map(w => w.chinese);
            let others = poolChinese.filter(c => c !== correct);
            // 去重並隨機選 2 個
            others = [...new Set(others)].sort(() => 0.5 - Math.random()).slice(0, 2);
            
            // 組合正確與錯誤選項並隨機排序
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
}).mount('#app'); // 這行非常重要，負責啟動 Vue！
