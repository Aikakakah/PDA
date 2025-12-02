/**
 * @module SecretHandler
 * Handles the special ringtone code 'AAAAAA' and the resulting screen interactions.
 * It manages the visual states (initial image, manic state with glitch, return to home).
 */

export function createSecretHandler(el, showView, ringtoneModal) {
    const IMAGE_PATH = '/images/';
    const IMAGE_INITIAL = IMAGE_PATH + 'SandyStars.png';
    const IMAGE_MANIC = IMAGE_PATH + 'SandyStarsManic.png';
    const GLITCH_1 = IMAGE_PATH + 'SandyStarsGlitch1.png';
    const GLITCH_2 = IMAGE_PATH + 'SandyStarsGlitch2.png';
    const SECRET_CODE = 'AAAAAA';

    let isSecretScreenActive = false;
    let glitchInterval = null;
    let clickCount = 0; // Tracks clicks: 0 (Initial) -> 1 (Manic) -> 2 (Stay Manic) -> 3 (Hide)

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
        // Title: Changes text content
        { selector: '.title', glitchText: 'PDA Systems' }, 
        // Footer Left: Uses existing text content ('Robust#OS™')
        // We target the inner div, not the .footer wrapper.
        { selector: '.footer .left', glitchText: null }, 
        // Footer Serial: Uses existing text content ('CLS-2282-0865')
        { selector: '.footer .right #serial', glitchText: null } 
    ];

    /**
     * Finds or creates the dedicated secret screen element and attaches the core click listener.
     */
    function getSecretScreenEl() {
        let screen = el('secretScreen');
        if (!screen) {
            screen = document.createElement('div');
            screen.id = 'secretScreen';
            screen.className = 'secret-screen hidden crt';
            // Target the inner screen container: <div class="content">
            const innerScreenContainer = document.querySelector('.content'); 
            
            if (innerScreenContainer) {
                innerScreenContainer.appendChild(screen); 
            } else {
                console.error("Inner PDA screen content div (.content) not found. Cannot create secret screen.");
                el('pda')?.appendChild(screen); 
            }

            // Core click listener logic: State 1 -> State 2 -> State 3 (Hide)
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
        }
        return screen;
    }
    
    // --- START: Glitch Helper Functions (New Unified Logic) ---

    /**
     * Finds all target elements, saves their original state, and applies the glitch effect.
     */
    function startGlitchEffect() {
        originalGlitchStates = []; // Reset state

        GLITCH_TARGETS.forEach(target => {
            const el = document.querySelector(target.selector);
            if (el) {
                const originalText = el.textContent;
                const newText = target.glitchText || originalText; // Use glitchText if defined, otherwise use original text

                // 1. Save original state
                originalGlitchStates.push({
                    el: el,
                    originalText: originalText,
                    originalDisplay: el.style.display, // Save original inline display style
                    originalWhiteSpace: el.style.whiteSpace // Save original inline white-space style
                });

                // 2. Set new content and styles
                el.textContent = newText;
                el.setAttribute('data-text', newText);
                el.classList.add('glitch');
                
                // *** FIX: Crucial properties for glitching text ***
                // Ensure text stays on a single line and the element behaves correctly for clipping
                el.style.display = 'inline-block';
                el.style.whiteSpace = 'nowrap'; 
            }
        });
    }

    /**
     * Restores all glitched elements to their original state.
     */
    function stopGlitchEffect() {
        originalGlitchStates.forEach(state => {
            // 1. Restore original text
            state.el.textContent = state.originalText;
            
            // 2. Restore original styles
            state.el.style.display = state.originalDisplay;
            state.el.style.whiteSpace = state.originalWhiteSpace;
            
            // 3. Remove glitch classes and data-text
            state.el.removeAttribute('data-text');
            state.el.classList.remove('glitch');
            
        });
        originalGlitchStates = []; // Clear state
    }

    // --- END: Glitch Helper Functions ---


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
        
        // Display the INITIAL image (SandyStars.png) as background
        screen.classList.remove('hidden');
screen.style.display = 'block';

// Add CRT turn-on animation
screen.classList.add('turn-on');

screen.style.backgroundImage = `url(${IMAGE_INITIAL})`;

        
        // IMPORTANT: Insert a transparent element to ensure the full area is clickable
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

    /**
     * State 2: Transitions to the manic state, changing the background and starting the glitch overlay.
     */
function showManicState() {
    const screen = getSecretScreenEl();
    if (!screen) return;

    // 1. Set the fixed background image (SandyStarsManic.png)
    screen.style.backgroundImage = `url(${IMAGE_MANIC})`; 
    
    // 2. Insert the glitch elements and the click catcher
    screen.innerHTML = `
    ${getCrtOverlayHtml()}
        <img id="glitchImage" src="${GLITCH_1}" class="glitch-image" alt="Glitch"/>
        <div class="click-catcher"></div>
    `;
    
    startGlitchFlicker(screen); 
    startGlitchEffect();
}

    /**
     * Starts the rapid image source switching for the glitch overlay.
     */
    function startGlitchFlicker(overlay) {
        if (glitchInterval) clearInterval(glitchInterval);

        const glitchImageEl = document.getElementById('glitchImage');
        if (!glitchImageEl) return;

        let isGlitch1 = true;
        glitchInterval = setInterval(() => {
            const currentGlitch = isGlitch1 ? GLITCH_1 : GLITCH_2;
            
            glitchImageEl.src = currentGlitch;
            
            isGlitch1 = !isGlitch1;
        }, 60); // 60ms for a rapid, unsettling flicker
    }

    /**
     * State 3: Stops the glitch effect and hides the secret screen, returning to the program view.
     */
    function hideSecretScreen() {
        const screen = getSecretScreenEl();
        if (!screen) return;

        // Stop the image glitch effect
        if (glitchInterval) {
            clearInterval(glitchInterval);
            glitchInterval = null;
        }

        // STOP: Stop the unified text glitch
        stopGlitchEffect();

        isSecretScreenActive = false;
        clickCount = 0; // Reset click count

        // Hide the screen
        screen.classList.add('hidden');
        screen.style.backgroundImage = 'none'; // Clear background
        screen.innerHTML = ''; // Clear all content including the glitch overlay
        
        // FIX: Force the element to be hidden immediately and not block the view 
        screen.style.display = 'none'; 

        // FIX: Explicitly call the main application's showView function to ensure 
        // the default 'programs' screen is made visible again. 
        if (typeof showView === 'function') {
            showView('programs');
        }
    }
    
    /**
     * Public method to check and handle the secret ringtone code.
     */
    function handleSecretRingtone(code) {
        // Case-insensitive comparison
        if (code.toUpperCase() === SECRET_CODE) { 
            showSecretScreen();
            ringtoneModal.close(); // Assuming this function exists and should be called
            return true;
        }
        return false;
    }

    // Public API
    return {
        handleSecretRingtone: handleSecretRingtone
    };
}