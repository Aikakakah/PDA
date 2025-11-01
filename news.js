// news.js

// The module exports a single factory function that accepts dependencies
export function createNewsModule(state, el, showView, ringtoneModal) {
    
    // Internal news data (added 'id' property for checking if unlocked)
    const specialArticles = {
        'eeeeee': {
            id: 'eeeeee',
            title: "Robust Media Broadcast",
            content: [
                "— TEST TEST TEST —",
                "TEST TEST TEST TEST TEST TEST..."
            ]
        },
        'eeeeea': {
            id: 'eeeeea',
            title: "Robust Media Broadcast",
            content: [
                "— OKAYOKAYOKAY —",
                "OKAYOKAYOKAY..."
            ]
        }
    };

    // Internal state for the module: tracks the index of the article currently displayed
    let currentArticleIndex = 0;

    // IMPORTANT: Ensure state.unlockedNews is an array, as it will now hold multiple articles
    if (!Array.isArray(state.unlockedNews)) {
        state.unlockedNews = []; 
    }

    /**
     * Renders the default 'Emergency Broadcast' screen.
     */
    function renderStationNews() {
        const programArea = el('programArea');
        const wrap = document.createElement('div');
        wrap.className = 'station-news';
        wrap.innerHTML = `
            <div class="cartridge-header">Station News Feed</div>
            <div class="news-title">Robust Media Broadcast</div>
            <div class="news-content">
                <p>— EMERGENCY BROADCAST UNAVAILABLE —</p>
                <p class="muted">Awaiting connection to Central Network Hub...</p>
            </div>
            <div class="news-controls">
                <button title="Previous" disabled><i class="fas fa-chevron-left"></i></button>
                <button title="Next" disabled><i class="fas fa-chevron-right"></i></button>
                <button title="Play Music"><i class="fas fa-music"></i></button>
            </div>
        `;
        programArea.innerHTML = '';
        programArea.appendChild(wrap);
        // Note: We no longer set state.unlockedNews = null, as we preserve the list
    }

    /**
     * Renders an unlocked news article.
     * @param {object} article - The article content to render.
     * @param {number} index - The index of the article in the unlockedNews array.
     */
    function renderUnlockedNews(article, index) {
        const programArea = el('programArea');
        const wrap = document.createElement('div');
        wrap.className = 'station-news';
        
        const articleCount = state.unlockedNews.length; 
        const currentIndex = index + 1; // 1-based index for display
        
        wrap.innerHTML = `
            <div class="cartridge-header">Station News Feed (${currentIndex}/${articleCount})</div>
            <div class="news-title">${article.title}</div>
            <div class="news-content">
                <p>${article.content[0]}</p>
                <p class="muted">${article.content[1]}</p>
            </div>
            <div class="news-controls">
                <button id="news-prev" title="Previous" ${currentIndex <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
                <button id="news-next" title="Next" ${currentIndex >= articleCount ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
                <button id="news-music" title="Play Music"><i class="fas fa-music"></i></button>
            </div>
        `;

        programArea.innerHTML = '';
        programArea.appendChild(wrap);
        showView('program');
        
        // Hide the modal immediately for better UX when the ringtone is tested
        if (ringtoneModal) ringtoneModal.classList.add('hidden'); 

        // Add event listeners for navigation
        el('news-prev')?.addEventListener('click', () => changeArticle(-1));
        el('news-next')?.addEventListener('click', () => changeArticle(1));
    }
    
    /**
     * Changes the currently viewed article by a delta (1 or -1).
     * @param {number} delta - The change in index (-1 for prev, 1 for next).
     */
    function changeArticle(delta) {
        let newIndex = currentArticleIndex + delta;
        
        // Clamp index between 0 and last unlocked article index
        const lastIndex = state.unlockedNews.length - 1;
        
        if (newIndex < 0) {
            newIndex = 0;
        } else if (newIndex > lastIndex) {
            newIndex = lastIndex;
        }
        
        if (newIndex !== currentArticleIndex) {
            currentArticleIndex = newIndex;
            renderNewsProgram(); // Re-render the view with the new article
        }
    }

    /**
     * Checks if the ringtone key unlocks a special article and updates state/view.
     * @param {string} key - The 6-character ringtone key (e.g., 'eeeeee').
     */
    function handleNewsArticle(key) {
        const articleToUnlock = specialArticles[key];

        if (articleToUnlock) {
            // Check if the article is already unlocked by ID
            const isAlreadyUnlocked = state.unlockedNews.some(article => article.id === key);
            
            if (!isAlreadyUnlocked) {
                // ADD the new article to the list
                state.unlockedNews.push(articleToUnlock);
                
                // Set the current view index to the newly added article
                currentArticleIndex = state.unlockedNews.length - 1; 
            }
            
            // If the user is currently on the News program, render the view
            if (el('view-program')?.classList.contains('active')) {
                renderNewsProgram();
            }
        }
        // If the key is invalid, we do nothing and preserve the unlocked list
    }
    
    /**
     * Renders the news program content based on the current unlocked state.
     */
    function renderNewsProgram() {
        if (state.unlockedNews.length > 0) {
            // Ensure the current index is valid before trying to read it
            if (currentArticleIndex < 0 || currentArticleIndex >= state.unlockedNews.length) {
                currentArticleIndex = state.unlockedNews.length - 1;
            }
            
            // Render the article at the current index
            const article = state.unlockedNews[currentArticleIndex];
            renderUnlockedNews(article, currentArticleIndex);
        } else {
            // If the array is empty, show the default screen
            renderStationNews();
        }
    }

    // Public API for the News Module
    return {
        renderNewsProgram: renderNewsProgram,
        handleNewsArticle: handleNewsArticle
    };
}