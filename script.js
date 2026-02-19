const { createApp } = Vue;
const WORD_SEEDS = ["negotiate", "strategy", "achievement", "available", "capacity", "efficient", "potential", "significant", "immediate", "flexible", "evaluate", "implement", "guarantee", "consequence", "frequent", "innovative", "advantage", "perspective", "relevant", "challenge"];

createApp({
    data() {
        return {
            currentTab: 'daily', dailyWords: [], loading: false,
            wordBank: JSON.parse(localStorage.getItem('myWords_v2') || '[]'),
            quizWords: [], currentQuizIndex: 0, currentOptions: [], score: 0, quizFinished: false
        }
    },
    mounted() { this.fetchAllData(); },
    methods: {
        async translate(text) {
            try {
                const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURI(text)}`);
                const data = await res.json();
                return data[0][0][0];
            } catch (e) { return "翻譯載入中"; }
        },
        async fetchAllData() {
            this.loading = true; this.dailyWords = [];
            const shuffled = [...WORD_SEEDS].sort(() => 0.5 - Math.random()).slice(0, 10);
            for (const word of shuffled) {
                try {
                    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                    const dictData = await dictRes.json();
                    if (dictData && dictData[0]) {
                        const entry = dictData[0];
                        let rawExs = [];
                        entry.meanings.forEach(m => m.definitions.forEach(d => {
                            if (d.example) rawExs.push(d.example);
                            else if (d.definition && rawExs.length < 3) rawExs.push(d.definition);
                        }));
                        rawExs = rawExs.slice(0, 3);
                        const [zhWord, ...zhExs] = await Promise.all([this.translate(word), ...rawExs.map(ex => this.translate(ex))]);
                        this.dailyWords.push({ word, phonetic: entry.phonetic || '', chinese: zhWord, examples: rawExs, chinese_ex: zhExs });
                    }
                } catch (e) { console.error(e); }
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
            if (!this.isInBank(this.wordBank, word.word)) {
                this.wordBank.push(JSON.parse(JSON.stringify(word)));
                localStorage.setItem('myWords_v2', JSON.stringify(this.wordBank));
            }
        },
        isInBank(bank, name) { return bank.some(w => w.word === name); },
        removeFromBank(index) {
            this.wordBank.splice(index, 1);
            localStorage.setItem('myWords_v2', JSON.stringify(this.wordBank));
        },
        startQuiz() {
            if (this.wordBank.length < 3) { alert("請先存入單字！"); return; }
            this.currentTab = 'quiz';
            this.quizWords = [...this.wordBank].sort(() => 0.5 - Math.random()).slice(0, 50);
            this.currentQuizIndex = 0; this.score = 0; this.quizFinished = false;
            this.generateOptions();
        },
        generateOptions() {
            const correct = this.quizWords[this.currentQuizIndex].chinese;
            let others = this.wordBank.map(w => w.chinese).filter(c => c !== correct);
            if (others.length < 2) others = ["錯誤選項A", "錯誤選項B"];
            others = [...new Set(others)].sort(() => 0.5 - Math.random()).slice(0, 2);
            this.currentOptions = [correct, ...others].sort(() => 0.5 - Math.random());
        },
        checkAnswer(ans) {
            if (ans === this.quizWords[this.currentQuizIndex].chinese) this.score += 2;
            if (this.currentQuizIndex < this.quizWords.length - 1) { this.currentQuizIndex++; this.generateOptions(); }
            else { this.quizFinished = true; }
        }
    }
}).mount('#app');
