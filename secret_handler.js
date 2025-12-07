/**
 * @module SecretHandler
 * Handles the special ringtone code 'AAAAAA' and the resulting screen interactions.
 * It manages the visual states (initial image, manic state with glitch, return to home).
 */

export function createSecretHandler(state, el, showView, ringtoneModal) {
    const IMAGE_PATH = '/images/';
    const IMAGE_INITIAL = IMAGE_PATH + 'SandyStars.png';
    const IMAGE_MANIC = IMAGE_PATH + 'SandyStarsManic.png';
    const GLITCH_1 = IMAGE_PATH + 'SandyStarsGlitch1.png';
    const GLITCH_2 = IMAGE_PATH + 'SandyStarsGlitch2.png';
    const SECRET_CODE = 'AAAAAA';

    let isSecretScreenActive = false;
    let glitchInterval = null;
    let clickCount = 0; // Tracks clicks: 0 (Initial) -> 1 (Manic) -> 2 (Stay Manic) -> 3 (Hide)
    let listenerAttached = false; 

    // NEW HELPER FUNCTION: HTML structure for the persistent CRT effects
    function getCrtOverlayHtml() {
        return `
            <div class="crt-scanlines"></div>
            <p>This is my secret place.</p>
            <div class="crt-noise-wrapper">
                <div class="crt-noise"></div>
                <div class="crt-noise crt-noise-moving"></div>
            </div>
        `;
    }

    let originalGlitchStates = [];
    
    // Define all elements to be glitched and their replacement text (if any)
    const GLITCH_TARGETS = [
        { selector: '.title', glitchText: 'PDA Systems' }, 
        { selector: '.footer .left', glitchText: null }, 
        { selector: '.footer .right #serial', glitchText: null } 
    ];

    /**
     * Finds or creates the dedicated secret screen element and attaches the core click listener.
     */
    function getSecretScreenEl() {
        let screen = el('secretScreen');
        
        // 1. Create if missing (fallback)
        if (!screen) {
            screen = document.createElement('div');
            screen.id = 'secretScreen';
            screen.className = 'secret-screen hidden crt';
            const innerScreenContainer = document.querySelector('.content'); 
            
            if (innerScreenContainer) {
                innerScreenContainer.appendChild(screen); 
            } else {
                el('pda')?.appendChild(screen); 
            }
        }

        // 2. Attach listener regardless of whether we created it or found it
        if (screen && !listenerAttached) {
            screen.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isSecretScreenActive) return;

                clickCount++; 
                if (clickCount === 1) {
                    showManicState();
                } else if (clickCount >= 3) {
                    hideSecretScreen();
                }
            }, { once: false });
            
            listenerAttached = true;
        }

        return screen;
    }
    
    function startGlitchEffect() {
        originalGlitchStates = []; 
        GLITCH_TARGETS.forEach(target => {
            const el = document.querySelector(target.selector);
            if (el) {
                const originalText = el.textContent;
                const newText = target.glitchText || originalText; 

                originalGlitchStates.push({
                    el: el,
                    originalText: originalText,
                    originalDisplay: el.style.display, 
                    originalWhiteSpace: el.style.whiteSpace 
                });

                el.textContent = newText;
                el.setAttribute('data-text', newText);
                el.classList.add('glitch');
                el.style.display = 'inline-block';
                el.style.whiteSpace = 'nowrap'; 
            }
        });
    }

    function stopGlitchEffect() {
        originalGlitchStates.forEach(state => {
            state.el.textContent = state.originalText;
            state.el.style.display = state.originalDisplay;
            state.el.style.whiteSpace = state.originalWhiteSpace;
            state.el.removeAttribute('data-text');
            state.el.classList.remove('glitch');
        });
        originalGlitchStates = []; 
    }

    /**
     * State 1: Shows the initial secret screen with SandyStars.png.
     */
    function showSecretScreen() {
        if (isSecretScreenActive) return;

        const screen = getSecretScreenEl();
        if (!screen) return;
        
        screen.classList.add('crt');
        isSecretScreenActive = true;
        clickCount = 0; 
        
        screen.classList.remove('hidden');
        screen.style.display = 'block';
        screen.classList.add('turn-on');
        screen.style.backgroundImage = `url(${IMAGE_INITIAL})`;

        // Play the static burst sound
        const audio = new Audio('/Audio/Effects/static_burst.ogg');
        audio.volume = 0.4;
        audio.play().catch(() => {});

        screen.innerHTML = `
            ${getCrtOverlayHtml()}
            <div class="initial-screen-content" style="z-index: 30; position: relative;">
                <p>This is my secret place.</p>
                <p>Don't click again.</p>
            </div>
            <div class="click-catcher" style="z-index: 100;"></div>
        `;
        
        if (glitchInterval) {
            clearInterval(glitchInterval);
            glitchInterval = null;
        }
        screen.addEventListener('animationend', () => {
            screen.classList.remove('turn-on');
        }, { once: true });
    }

    function showManicState() {
        const screen = getSecretScreenEl();
        if (!screen) return;

        screen.style.backgroundImage = `url(${IMAGE_MANIC})`; 
        
        screen.innerHTML = `
        ${getCrtOverlayHtml()}
            <img id="glitchImage" src="${GLITCH_1}" class="glitch-image" alt="Glitch"/>
            <div class="click-catcher"></div>
        `;
        
        startGlitchFlicker(screen); 
        startGlitchEffect();
    }

    function startGlitchFlicker(overlay) {
        if (glitchInterval) clearInterval(glitchInterval);
        const glitchImageEl = document.getElementById('glitchImage');
        if (!glitchImageEl) return;

        let isGlitch1 = true;
        glitchInterval = setInterval(() => {
            const currentGlitch = isGlitch1 ? GLITCH_1 : GLITCH_2;
            glitchImageEl.src = currentGlitch;
            isGlitch1 = !isGlitch1;
        }, 60); 
    }

    function hideSecretScreen() {
        const screen = getSecretScreenEl();
        if (!screen) return;

        if (glitchInterval) {
            clearInterval(glitchInterval);
            glitchInterval = null;
        }

        stopGlitchEffect();
        isSecretScreenActive = false;
        clickCount = 0; 

        screen.classList.add('hidden');
        screen.style.backgroundImage = 'none'; 
        screen.innerHTML = ''; 
        screen.style.display = 'none'; 

        if (typeof showView === 'function') {
            showView('programs');
        }
    }
    
    function renderFiles() {
        const list = el('fileList');
        if (!list) return;
        list.innerHTML = '';

        const files = [
            { name: "Sys_Log_882.txt", type: "text" },
            // The file that triggers the secret screen
            { name: "Sol-131_arrivals.mp4", type: "video", special: true }, 
            { name: "Corrupted_Data_001.dat", type: "bin", corrupt: true }
        ];

        // --- NEW: Check if Stardust is unlocked ---
        if (state.unlockedFeatures && state.unlockedFeatures.stardust) {
            // Add the MP3 file to the list
            files.push({ name: "stardust.mp3", type: "audio" });
        }

        files.forEach(f => {
            const row = document.createElement('div');
            row.className = `file-row ${f.corrupt ? 'corrupt' : ''}`;
            
            let icon = '<i class="fas fa-file-alt"></i>';
            if(f.type === 'video') icon = '<i class="fas fa-film"></i>';
            if(f.type === 'bin') icon = '<i class="fas fa-binary"></i>';
            if(f.type === 'audio') icon = '<i class="fas fa-music"></i>'; // New Icon

            row.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-name">${f.name}</div>
            `;

            row.addEventListener('click', () => {
                if (f.corrupt) return; 

                // Handle Audio Playback
                if (f.type === 'audio') {
                    const audio = new Audio('/Audio/stardust.mp3'); 
                    audio.play().catch(e => console.log("Audio play error", e));
                    return;
                }

                if (f.special && f.name === "Sol-131_arrivals.mp4") {
                    showSecretScreen(); 
                } else {
                    alert("File viewer module offline. Only raw video playback supported.");
                }
            });

            list.appendChild(row);
        });
    }

    /**
     * Public method to navigate to the files view and render the content.
     */
    function openFilesView() {
        showView('files');
        renderFiles();
        
        const backBtn = el('btn-files-back');
        if (backBtn) {
            backBtn.onclick = null; 
            backBtn.addEventListener('click', () => {
                showView('settings');
            }, { once: true });
        }
    }

    function handleSecretRingtone(code) {
        if (code.toUpperCase() === SECRET_CODE) { 
            showSecretScreen();
            ringtoneModal.classList.add('hidden'); 
            return true;
        }
        return false;
    }

    // --- NEW: Public Function to Unlock Stardust ---
    function unlockStardust() {
        // Ensure the flag exists
        if (!state.unlockedFeatures.stardust) {
            state.unlockedFeatures.stardust = true;
            console.log("Stardust audio unlocked!");
            
            // If the user is currently looking at the files list, refresh it
            if (document.getElementById('view-files')?.classList.contains('active')) {
                renderFiles();
            }
            return true; // Return true so caller knows to save game state
        }
        return false;
    }

    // --- PUBLIC API ---
    return {
        handleSecretRingtone: handleSecretRingtone,
        trigger: showSecretScreen,
        openFilesView: openFilesView,
        unlockStardust: unlockStardust // Exposed here
    };
}