document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const textInput = document.getElementById('text-input');
    const btnLoad = document.getElementById('btn-load-text');
    const wordCountDisplay = document.getElementById('word-count');

    const wordLeftFn = document.getElementById('word-left');
    const wordOrpFn = document.getElementById('word-orp');
    const wordRightFn = document.getElementById('word-right');

    const wpmSlider = document.getElementById('wpm-slider');
    const wpmDisplay = document.getElementById('wpm-display');

    const btnToggle = document.getElementById('btn-toggle');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const btnRestart = document.getElementById('btn-restart');
    const btnStop = document.getElementById('btn-stop');

    const progressBar = document.getElementById('progress-bar');
    const currentWordIndexDisplay = document.getElementById('current-word-index');
    const totalWordsDisplay = document.getElementById('total-words');

    // State
    let words = [];
    let currentIndex = 0;
    let isPlaying = false;
    let timerId = null;
    let wpm = 300;

    // Constants
    const DEFAULT_TEXT = "Rapid Serial Visual Presentation (RSVP) is a method of displaying information (generally text) in which the text is displayed word-by-word in a fixed focal position. This method allows reading at very high speeds because it eliminates eye movements.";

    // Logic for ORP Calculation (approx 35% mark)
    // Returns index of the character to highlight
    function getORPIndex(word) {
        const length = word.length;
        if (length === 1) return 0;
        // Standard RSVP formula often relies on center-ish but slightly left
        // 2 chars -> index 0 or 1? usually 0.
        // 5 chars -> 1.75 -> index 1 or 2? 
        // Let's use the explicit rule: Math.floor((length - 1) * 0.35) or similar?
        // Actually, a simpler robust mapping:
        let position = 0;
        if (length <= 1) position = 0;
        else if (length >= 2 && length <= 5) position = 1; // 2->2nd char (idx 1) is maybe too far right? 
        // Specific ORP logic:
        // 1: 1 (idx 0)
        // 2: 1 (idx 0) or 2 (idx 1)? -> 'of' -> 'o' is better. idx 0.
        // 3: 2 (idx 1) -> 'the' -> 'h'
        // 4: 2 (idx 1) -> 'that' -> 'h'
        // 5: 2 (idx 1) -> 'which' -> 'h' ? Or 'i' (idx 2)?
        // 6: 3 (idx 2) 
        // 7: 3 (idx 2)
        // 8: 3 (idx 2) or 4 (idx 3)
        // Let's use a percentage based Math.ceil(length * 0.35) - 1, bounded to at least 0.

        position = Math.ceil(length * 0.35) - 1;
        if (position < 0) position = 0;
        return position;
    }

    function renderWord() {
        if (currentIndex >= words.length) {
            stop();
            return;
        }

        const word = words[currentIndex];
        const orpIndex = getORPIndex(word);

        const leftText = word.substring(0, orpIndex);
        const orpChar = word.substring(orpIndex, orpIndex + 1);
        const rightText = word.substring(orpIndex + 1);

        wordLeftFn.textContent = leftText;
        wordOrpFn.textContent = orpChar;
        wordRightFn.textContent = rightText;

        // Update UI
        const progress = ((currentIndex + 1) / words.length) * 100;
        progressBar.style.width = `${progress}%`;
        currentWordIndexDisplay.textContent = currentIndex + 1;
    }

    function step() {
        currentIndex++;
        if (currentIndex >= words.length) {
            stop();
        } else {
            renderWord();
            scheduleNext();
        }
    }

    function scheduleNext() {
        // Calculate delay based on WPM
        // Extra delay for punctuation could be added here
        const baseDelay = 60000 / wpm;
        let delay = baseDelay;

        // Simple punctuation pause logic
        const currentWord = words[currentIndex];
        if (currentWord.endsWith('.') || currentWord.endsWith('!') || currentWord.endsWith('?')) {
            delay = baseDelay * 2.5;
        } else if (currentWord.endsWith(',') || currentWord.endsWith(';')) {
            delay = baseDelay * 1.5;
        }

        timerId = setTimeout(step, delay);
    }

    function play() {
        if (currentIndex >= words.length) {
            currentIndex = 0;
        }
        isPlaying = true;
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        renderWord(); // Show immediate
        scheduleNext();
    }

    function pause() {
        isPlaying = false;
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
    }

    function stop() {
        pause();
        currentIndex = 0;
        renderWord();
        progressBar.style.width = '0%';
    }

    function processText(text) {
        // Split by spaces, newlines, etc. Filter empty.
        return text.split(/\s+/).filter(w => w.length > 0);
    }

    function loadTextFromInput() {
        const text = textInput.value.trim() || DEFAULT_TEXT;
        words = processText(text);
        totalWordsDisplay.textContent = words.length;
        wordCountDisplay.textContent = `${words.length} words`;

        // Reset state
        stop();
    }

    // Event Listeners
    btnToggle.addEventListener('click', () => {
        if (isPlaying) pause();
        else play();
    });

    btnRestart.addEventListener('click', stop);

    btnStop.addEventListener('click', stop);

    wpmSlider.addEventListener('input', (e) => {
        wpm = parseInt(e.target.value, 10);
        wpmDisplay.textContent = wpm;
    });

    btnLoad.addEventListener('click', loadTextFromInput);

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const iconSun = document.getElementById('icon-sun');
    const iconMoon = document.getElementById('icon-moon');
    const body = document.body;

    // Check saved preference
    const savedTheme = localStorage.getItem('rsvp-theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        iconSun.classList.remove('hidden');
        iconMoon.classList.add('hidden');
    } else {
        iconSun.classList.add('hidden');
        iconMoon.classList.remove('hidden');
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');

        if (isLight) {
            iconSun.classList.remove('hidden');
            iconMoon.classList.add('hidden');
            localStorage.setItem('rsvp-theme', 'light');
        } else {
            iconSun.classList.add('hidden');
            iconMoon.classList.remove('hidden');
            localStorage.setItem('rsvp-theme', 'dark');
        }
    });

    // ORP Color Picker Logic
    const colorPicker = document.getElementById('color-picker');
    const savedColor = localStorage.getItem('rsvp-highlight-color');

    function updateHighlightColor(color) {
        document.documentElement.style.setProperty('--highlight-color', color);
        // Also update the guide lines if they use the same var? Yes they do.
        localStorage.setItem('rsvp-highlight-color', color);
    }

    if (savedColor) {
        colorPicker.value = savedColor;
        updateHighlightColor(savedColor);
    }

    colorPicker.addEventListener('input', (e) => {
        updateHighlightColor(e.target.value);
    });

    // Initial Load
    // Trigger input event manually to set initial state
    textInput.dispatchEvent(new Event('input'));
    loadTextFromInput();

    // Word Limit Logic
    const MAX_WORD_COUNT = 5000;

    textInput.addEventListener('input', () => {
        const text = textInput.value;
        // Basic split to get rough count
        const currentWords = text.trim().split(/\s+/).filter(w => w.length > 0);
        const count = currentWords.length;

        // Update display
        wordCountDisplay.textContent = `${count} / ${MAX_WORD_COUNT} words`;

        if (count > MAX_WORD_COUNT) {
            wordCountDisplay.classList.add('limit-exceeded');
            btnLoad.disabled = true;
            btnLoad.title = "Word limit exceeded";
        } else {
            wordCountDisplay.classList.remove('limit-exceeded');
            btnLoad.disabled = false;
            btnLoad.title = "";
        }
    });
});
