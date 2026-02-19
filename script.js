const { createApp } = Vue;

// 常用單字種子庫 (程式會從這裡挑字去網路上抓詳情)
const WORD_SEEDS = [
    "achievement", "advantage", "analysis", "approach", "appropriate", "available", "benefit", "category",
    "challenge", "circumstance", "colleague", "commercial", "commitment", "comparison", "consequence",
    "considerable", "contribution", "coordinate", "demonstrate", "department", "dimension", "distribution",
    "efficiency", "eliminate", "emphasis", "ensure", "estimate", "evaluate", "evidence", "executive",
    "flexible", "frequency", "guarantee", "implement", "incentive", "innovation", "inspection", "inventory",
    "maintenance", "negotiate", "objective", "opportunity", "participation", "perspective", "potential",
    "priority", "purchase", "reputation", "requirement", "significant", "strategy", "sufficient", "transfer"
];

createApp({
    data() {
        return {
            currentTab: 'daily',
            dailyWords: [],
            wordBank: JSON.parse(localStorage.getItem('myWords') || '[]'),
            loading: false,
            // 測驗相關
            quizWords: [],
            currentQuizIndex: 0,
            currentOptions: [],
            score: 0,
            quizFinished: false
        }
    },
    mounted() {
        this.fetchAllData();
    },
    methods: {
        // 利用 Google Translate 公開 API 進行翻譯
        async translate(text) {
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURI(text)}`;
                const res = await fetch(url);
                const data = await res.json();
                return data[0][0][0];
            } catch (e) {
                return "翻譯獲取中";
            }
        },

        async fetchAllData() {
            this.loading = true;
            this.dailyWords = [];
            // 隨機抽選 10 個
            const shuffled = [...WORD_SEEDS].sort(() => 0.5 - Math.random()).slice(0, 10);

            for (const word of shuffled) {
                try {
                    // 抓取 Dictionary API
                    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                    const dictData = await dictRes.json();
                    
                    if (dictData && dictData[0]) {
                        const entry = dictData[0];
                        
                        // 整理例句或定義
                        let rawExs = [];
                        entry.meanings.forEach(m => {
                            m.definitions.forEach(d => {
                                if (d.example) rawExs.push(d.example);
                                else if (d.definition && rawExs.length < 3) rawExs.push(d.definition);
                            });
                        });
                        rawExs = rawExs.slice(0, 3);

                        // 平行執行單字翻譯與例句翻譯
                        const [chineseWord, ...chineseExs] = await Promise.all([
                            this.translate(word),
                            ...rawExs.map(ex => this.translate(ex))
                        ]);

                        this.dailyWords.push({
                            word: entry.word,
                            phonetic: entry.phonetic || (entry.phonetics[0] ? entry.phonetics[0].text : ''),
                            chinese: chineseWord,
                            examples: rawExs,
                            chinese_ex: chineseExs
                        });
                    }
                } catch (e) {
                    console.error("單字抓取失敗:", word);
                }
            }
            this.loading = false;
        },

        speak(text) {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'en-US';
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
                alert("單字庫至少要存入 3 個單字喔！");
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
            // 錯誤選項優先從庫中抓，不夠就隨機給
            let others = this.wordBank.map(w => w.chinese).filter(c => c !== correct);
            if (others.length < 2) others = ["正確", "錯誤", "不確定"]; 
            
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
