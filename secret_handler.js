/**
 * @module SecretHandler
 * Manages the unified Secret Engine for PDA.
 * Features: Shared CRT effects, Layered SandyStars glitches, and Stable Story blocks.
 */

export function createSecretHandler(state, el, showView, ringtoneModal) {
    const IMAGE_PATH = '/images/';
    let htmlTemplates = document.createElement('div');
    
    async function loadTemplates() {
        try {
            const response = await fetch('secrets.html');
            const text = await response.text();
            htmlTemplates.innerHTML = text;
        } catch (err) {
            console.error("Failed to load secret templates:", err);
        }
    }
    loadTemplates();
    // --- 1. The Registry ---
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
            manicText: "Don't click again." // Manic text usually stays in JS for logic
        },
        'garden_chess': {
            trigger: { type: 'nanochat', contact: 'Ronin Pallas', keyword: 'GARDEN' },
            behavior: 'story',
            image: IMAGE_PATH + 'SandyStars.png',
            audio: '/Audio/Effects/static_burst.ogg'
        }
    };

    const FILE_SYSTEM = [
        { name: "Sol-131_arrivals.mp4", icon: "fa-video", secretKey: "sandy_stars", visible: true },
        { name: "Garden_Chess.log", icon: "fa-file-code", secretKey: "garden_chess", visible: true }
    ];

    let currentSecret = null;
    let clickCount = 0;
    let glitchInterval = null;
    let originalGlitchStates = [];

    // --- 2. CRT & Glitch Helpers ---

    function getCrtOverlayHtml() {
        return `
            <div class="crt-scanlines"></div>
            <div class="crt-noise-wrapper">
                <div class="crt-noise"></div>
                <div class="crt-noise crt-noise-moving"></div>
            </div>
            <div class="glitch-overlay"></div>
        `;
    }

    function startTextGlitch() {
        const targets = [
            { selector: '.title', text: 'PDA Systems' },
            { selector: '.footer .left', text: null },
            { selector: '.footer .right #serial', text: null }
        ];
        originalGlitchStates = [];
        targets.forEach(t => {
            const element = document.querySelector(t.selector);
            if (element) {
                originalGlitchStates.push({ el: element, txt: element.textContent });
                element.textContent = t.text || element.textContent;
                element.classList.add('glitch');
                element.setAttribute('data-text', element.textContent);
            }
        });
    }

    function stopTextGlitch() {
        originalGlitchStates.forEach(item => {
            item.el.textContent = item.txt;
            item.el.classList.remove('glitch');
            item.el.removeAttribute('data-text');
        });
        originalGlitchStates = [];
    }

    // --- 3. Core Logic ---

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

        // Grab the specific HTML block from your secrets.html file
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

        if (config.audio) new Audio(config.audio).play().catch(() => {});
        
        // Interaction listener
        screen.onclick = (e) => {
            e.stopPropagation();
            handleInteraction();
        };
    }

    function handleInteraction() {
        clickCount++;
        if (currentSecret.behavior === 'manic') {
            if (clickCount === 1) {
                startManicCycle();
            } else if (clickCount >= 3) {
                closeSecret();
            }
        } else {
            closeSecret();
        }
    }

    function startManicCycle() {
        const screen = el('secretScreen');
        const config = currentSecret;
        const glitchOverlay = screen.querySelector('.glitch-overlay');
        
        // Base background becomes the "Manic" state
        screen.style.backgroundImage = `url(${config.images.manic})`;
        const hint = screen.querySelector('.secret-hint');
        if (hint) hint.innerText = config.manicText;

        // Glitch rotation happens on the OVERLAY, not the background
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

        startTextGlitch();
    }

    function closeSecret() {
        if (glitchInterval) clearInterval(glitchInterval);
        stopTextGlitch();
        const screen = el('secretScreen');
        screen.classList.add('hidden');
        screen.style.display = 'none';
        screen.innerHTML = '';
        currentSecret = null;
        showView('programs');
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
                openSecret('sandy_stars');
                ringtoneModal.classList.add('hidden');
                return true;
            }
            return false;
        },
        checkNanoChatTrigger: (contact, message) => {
            const garden = SECRETS.garden_chess;
            if (contact === garden.trigger.contact && message.toUpperCase().includes(garden.trigger.keyword)) {
                state.unlockedFeatures.garden_chess = true;
                openSecret('garden_chess');
                return true;
            }
            return false;
        },
        trigger: (key) => openSecret(key),
        openFilesView: () => { showView('files'); renderFiles(); },
        unlockStardust: () => {
            state.unlockedFeatures.stardust = true;
            if (document.getElementById('view-files')?.classList.contains('active')) renderFiles();
        }
    };
}