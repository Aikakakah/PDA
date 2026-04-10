/**
 * @module SecretHandler
 * Manages the unified Secret Engine for PDA.
 */

export function createSecretHandler(state, el, showView, ringtoneModal) {
    // Detect if we are on GitHub Pages or Localhost
    const isGitHubPages = window.location.hostname.includes('github.io');
    const repoName = '/PDA/'; 
    
    // Set base path: GitHub Pages needs the repo name, local usually doesn't
    const BASE_PATH = isGitHubPages ? repoName : '/';
    const IMAGE_PATH = `${BASE_PATH}Images/`;
    
    let htmlTemplates = document.createElement('div');
    
    async function loadTemplates() {
        try {
            // Use the same base path logic for the fetch
            const response = await fetch(`${BASE_PATH}secrets.html`);
            const text = await response.text();
            htmlTemplates.innerHTML = text;
        } catch (err) {
            console.error("Failed to load secret templates:", err);
        }
    }
    loadTemplates();

    const SECRETS = {
        'sandy_stars': {
            trigger: { type: 'ringtone', code: 'AAAAAA' },
            behavior: 'manic',
            images: {
                initial: IMAGE_PATH + 'SandyStars.png',
                manic: IMAGE_PATH + 'SandyStarsManic.png',
                glitch1: IMAGE_PATH + 'SandyStarsGlitch1.png',
                glitch2: IMAGE_PATH + 'SandyStarsGlitch2.png'
            },
            audio: '/Audio/Effects/static_burst.ogg',
        },
        'sandy_star': {
            trigger: { type: 'ringtone', code: 'AAAAAB' },
            behavior: 'story',
            image: IMAGE_PATH + 'SandyStars.png',
        },
        'checkmate': {
            trigger: { type: 'ringtone', code: 'AAAAAC' },
            behavior: 'story',
            image: IMAGE_PATH + 'Checkmate.png',
        },
        'smoke_in_the_garden': {
            trigger: { type: 'ringtone', code: 'AAAAAD' },
            behavior: 'story',
            image: IMAGE_PATH + 'SandyStars.png',
        },
        'stardust': {
            trigger: { type: 'nanochat', contact: 'Ronin Pallas', keyword: 'GARDEN' },
            behavior: 'story',
            image: IMAGE_PATH + 'SandyStars.png',
        },
    };

    const FILE_SYSTEM = [
        { name: "Sol-131_arrivals.mp4", icon: "fa-video", secretKey: "sandy_stars", visible: true },
        { name: "sandy.log", icon: "fa-video", secretKey: "sandy_star", visible: true },
        { name: "checkmate.log", icon: "fa-file-code", secretKey: "checkmate", visible: true },
        { name: "garden.log", icon: "fa-file-code", secretKey: "smoke_in_the_garden", visible: true },
        { name: "stardust.log", icon: "fa-file-code", secretKey: "stardust", visible: true }
    ];

    let currentSecret = null;
    let clickCount = 0;
    let glitchInterval = null;
    let originalGlitchStates = [];
    let scrollObserver = null;

    // --- 2. CRT & Glitch Helpers ---

    function getCrtOverlayHtml() {
        return `
            <div class="crt-scanlines"></div>
            <div class="crt-noise-wrapper">
                <div class="crt-noise crt-noise-moving"></div>
            </div>
            <div class="glitch-overlay"></div>
        `;
    }

    // --- Core Logic ---

    function openSecret(key) {
        const config = SECRETS[key];
        if (!config) return;

        currentSecret = config;
        clickCount = 0;
        const screen = el('secretScreen');
        
        screen.classList.remove('hidden');
        screen.style.display = 'block';
        
        // Determine initial image (Manic uses 'initial', Story uses 'image')
        const bgImg = config.behavior === 'manic' ? config.images.initial : config.image;
        const template = htmlTemplates.querySelector(`[data-secret="${key}"]`);
        const contentHtml = template ? template.innerHTML : `<p>Error: Template for ${key} not found.</p>`;
        
        screen.innerHTML = `
            <div class="secret-bg-layer turn-on" style="background-image: url('${bgImg}')">
                ${getCrtOverlayHtml()}
            </div>
            
            <div class="secret-content-layer">
                ${contentHtml}
            </div>
        `;

        // --- Scroll Trigger Logic ---
        if (config.behavior === 'manic') {
            const storyBox = screen.querySelector('.secret-story-box');
            const triggers = storyBox.querySelectorAll('.manic-trigger');

            scrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        startManicCycle();
                    } else {
                        stopManicCycle();
                    }
                });
            }, { 
                root: storyBox, // Watch visibility relative to the scrollable box
                threshold: 0.1  // Trigger when 10% of the text is visible
            });

            triggers.forEach(t => scrollObserver.observe(t));
        }

        if (config.audio) new Audio(config.audio).play().catch(() => {});
        
        // Interaction listener
        screen.onclick = (e) => {
            e.stopPropagation();
            closeSecret();
        };
    }

    function startManicCycle() {
        const screen = el('secretScreen');
        const config = currentSecret;
        if (!config) return;

        const bgLayer = screen.querySelector('.secret-bg-layer');
        const glitchOverlay = screen.querySelector('.glitch-overlay');
        
        if (bgLayer) bgLayer.style.backgroundImage = `url(${config.images.manic})`;

        if (glitchInterval) clearInterval(glitchInterval);
        glitchInterval = setInterval(() => {
            const rand = Math.random();
            if (rand < 0.12) {
                glitchOverlay.style.backgroundImage = `url(${config.images.glitch1})`;
                glitchOverlay.style.opacity = '1';
            } else if (rand < 0.24) {
                glitchOverlay.style.backgroundImage = `url(${config.images.glitch2})`;
                glitchOverlay.style.opacity = '1';
            } else {
                glitchOverlay.style.opacity = '0';
            }
        }, 130);
    }

    function stopManicCycle() {
        if (glitchInterval) clearInterval(glitchInterval);
        
        const screen = el('secretScreen');
        const glitchOverlay = screen.querySelector('.glitch-overlay');
        if (glitchOverlay) {
            glitchOverlay.style.opacity = '0';
        }
        
        // Revert to initial image if it's a manic secret
        if (currentSecret && currentSecret.behavior === 'manic') {
            const bgLayer = screen.querySelector('.secret-bg-layer');
            if (bgLayer) bgLayer.style.backgroundImage = `url(${currentSecret.images.initial})`;
        }
    }

    function closeSecret() {
        if (scrollObserver) {
            scrollObserver.disconnect();
            scrollObserver = null;
        }
        stopManicCycle(); // Ensure all effects stop
        const screen = el('secretScreen');
        screen.classList.add('hidden');
        screen.style.display = 'none';
        screen.innerHTML = '';
        currentSecret = null;
    }

    // --- 4. API & Triggers ---

    function renderFiles() {
        const list = el('fileList');
        if (!list) return;
        list.innerHTML = '';

        FILE_SYSTEM.forEach(file => {
            const isUnlocked = file.secretKey && state.unlockedFeatures[file.secretKey];
            if (file.visible === false && !isUnlocked) return;

            const row = document.createElement('div');
            row.className = 'file-row';
            row.innerHTML = `<div class="file-icon"><i class="fas ${file.icon}"></i></div><div class="file-name">${file.name}</div>`;
            row.onclick = () => openSecret(file.secretKey);
            list.appendChild(row);
        });
    }

    return {
        handleSecretRingtone: (code) => {
            if (code.toUpperCase() === SECRETS.sandy_stars.trigger.code) {
                openSecret('sandy_star');
                ringtoneModal.classList.add('hidden');
                return true;
            }
            if (code.toUpperCase() === SECRETS.sandy_star.trigger.code) {
                openSecret('sandy_star');
                ringtoneModal.classList.add('hidden');
                return true;
            }
            if (code.toUpperCase() === SECRETS.smoke_in_the_garden.trigger.code) {
                openSecret('smoke_in_the_garden');
                ringtoneModal.classList.add('hidden');
                return true;
            }
            if (code.toUpperCase() === SECRETS.checkmate.trigger.code) {
                openSecret('checkmate');
                ringtoneModal.classList.add('hidden');
                return true;
            }
            return false;
        },
        checkNanoChatTrigger: (contact, message) => {
            const config = SECRETS.stardust;
            if (!config) {
                console.warn("Secret 'stardust' not found in registry.");
                return false;
            }
            // Normalize both for a "fuzzy" match
            const incomingContact = contact.toLowerCase().trim();
            const targetContact = config.trigger.contact.toLowerCase().trim();
            const incomingMessage = message.toUpperCase();
            const targetKeyword = config.trigger.keyword;

            if (incomingContact === targetContact && incomingMessage.includes(targetKeyword)) {
                console.log("Triggering Stardust story...");
                
                // Ensure state object and unlockedFeatures exist
                if (state && state.unlockedFeatures) {
                    state.unlockedFeatures.stardust = true;
                }

                openSecret('stardust');
                return true;
            }
            return false;
        },
        trigger: (key) => openSecret(key),
        openFilesView: () => { showView('files'); renderFiles(); },
        unlockStardust: () => {
            state.unlockedFeatures.stardust = true;
            state.unlockedFeatures.music = true;
            if (document.getElementById('view-files')?.classList.contains('active')) renderFiles();
        }
    };
}