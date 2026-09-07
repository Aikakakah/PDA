/**
 * @module SecretHandler
 * Manages the unified Secret Engine for PDA.
 */

export function createSecretHandler(state, el, showView, ringtoneModal) {
    // --- Environment Setup & Constants ---
    const isGitHubPages = window.location.hostname.includes('github.io');
    const repoName = '/PDA/'; 
    const BASE_PATH = isGitHubPages ? repoName : '/';
    const IMAGE_PATH = `${BASE_PATH}Images/`;
    
    let htmlTemplates = document.createElement('div');
    let currentSecret = null;
    let glitchInterval = null;
    let scrollObserver = null;
    let dialogueHandler = null;

    async function loadTemplates() {
        try {
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
            behavior: 'manic',
            images: {
                initial: IMAGE_PATH + 'Checkmate.png',
                manic: IMAGE_PATH + 'Checkmate-F7.png'
            }
        },
        'smoke_in_the_garden': {
            trigger: { type: 'ringtone', code: 'AAAAAD' },
            behavior: 'story',
            image: IMAGE_PATH + 'Recovery.png',
        },
        'stardust': {
            trigger: { type: 'nanochat', contact: 'Ronin Pallas', keyword: 'GARDEN' },
            behavior: 'story',
            image: IMAGE_PATH + 'SandyStars.png',
        },
        'sandychat': {
            trigger: { type: 'nanochat', contact: 'Ronin Pallas', keyword: 'SANDY' },
            behavior: 'dialogue',
            image: IMAGE_PATH + 'dialogue_background.png',
        },
    };

    const FILE_SYSTEM = [
        { name: "Sol-131_arrivals.mp4", icon: "fa-video", secretKey: "sandy_stars", visible: true },
        { name: "sandy.log", icon: "fa-video", secretKey: "sandy_star", visible: true },
        { name: "checkmate.log", icon: "fa-file-code", secretKey: "checkmate", visible: true },
        { name: "garden.log", icon: "fa-file-code", secretKey: "smoke_in_the_garden", visible: true },
        { name: "stardust.log", icon: "fa-file-code", secretKey: "stardust", visible: true },
        { name: "sandychat.log", icon: "fa-file-code", secretKey: "sandychat", visible: true }
    ];

    // --- Helpers ---

    function getCrtOverlayHtml() {
        return `
            <div class="crt-scanlines"></div>
            <div class="crt-noise-wrapper">
                <div class="crt-noise crt-noise-moving"></div>
            </div>
            <div class="glitch-overlay"></div>
        `;
    }

    // --- Behavior Blocks ---

    const BehaviorHandlers = {
        story: {
            render: (config, contentHtml) => `
                <div class="secret-bg-layer turn-on">
                    <div class="bg-initial" style="background-image: url('${config.image}')"></div>
                    <div class="bg-manic" style="background-image: url('${config.image}'); opacity: 0;"></div>
                    ${getCrtOverlayHtml()}
                </div>
                <div class="secret-content-layer">${contentHtml}</div>
            `,
            attach: () => {}
        },

        manic: {
            preload: async (config) => {
                const images = [config.images.initial, config.images.manic];
                if (config.images.glitch1) images.push(config.images.glitch1);
                if (config.images.glitch2) images.push(config.images.glitch2);

                await Promise.all(images.map(imgSrc => new Promise((resolve) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = resolve;
                    img.src = imgSrc;
                })));
            },
            render: (config, contentHtml) => `
                <div class="secret-bg-layer turn-on">
                    <div class="bg-initial" style="background-image: url('${config.images.initial}')"></div>
                    <div class="bg-manic" style="background-image: url('${config.images.manic}'); opacity: 0;"></div>
                    ${getCrtOverlayHtml()}
                </div>
                <div class="secret-content-layer">${contentHtml}</div>
            `,
            attach: (screen) => {
                const storyBox = screen.querySelector('.secret-story-box');
                if (!storyBox) return;

                const triggers = storyBox.querySelectorAll('.manic-trigger');
                scrollObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            startManicCycle();
                        } else {
                            stopManicCycle();
                        }
                    });
                }, { root: storyBox, threshold: 0.1 });

                triggers.forEach(t => scrollObserver.observe(t));
            }
        },

        dialogue: {
            render: (config, contentHtml) => `
                <div class="secret-bg-layer turn-on">
                    <div class="bg-initial" style="background-image: url('${config.image}')"></div>
                    ${getCrtOverlayHtml()}
                </div>
                <div class="secret-dialogue-layer">${contentHtml}</div>
            `,
            attach: (screen, key, contactInfo, messageInfo) => {
                if (dialogueHandler) {
                    dialogueHandler.handleDialogueReveal(key, contactInfo, messageInfo);
                }
            }
        }
    };

    // --- Manic State Loop ---

    function startManicCycle() {
        const screen = el('secretScreen');
        const config = currentSecret;
        if (!config || !config.images) return;

        const bgInitial = screen.querySelector('.bg-initial');
        const bgManic = screen.querySelector('.bg-manic');
        const glitchOverlay = screen.querySelector('.glitch-overlay');
        
        if (bgInitial) bgInitial.style.opacity = '0';
        if (bgManic) bgManic.style.opacity = '1';

        if (glitchInterval) clearInterval(glitchInterval);
        glitchInterval = setInterval(() => {
            const rand = Math.random();
            if (rand < 0.12 && config.images.glitch1) {
                glitchOverlay.style.backgroundImage = `url(${config.images.glitch1})`;
                glitchOverlay.style.opacity = '1';
            } else if (rand < 0.24 && config.images.glitch2) {
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
        const bgInitial = screen.querySelector('.bg-initial');
        const bgManic = screen.querySelector('.bg-manic');
        const glitchOverlay = screen.querySelector('.glitch-overlay');
        
        if (bgInitial) bgInitial.style.opacity = '1';
        if (bgManic) bgManic.style.opacity = '0';
        if (glitchOverlay) glitchOverlay.style.opacity = '0';
    }

    // --- Core Logic ---

    async function openSecret(key, contactInfo = null, messageInfo = null) {
        const config = SECRETS[key];
        if (!config) return;

        currentSecret = config;
        const screen = el('secretScreen');
        const handler = BehaviorHandlers[config.behavior];

        if (!handler) {
            console.error(`Unknown secret behavior: ${config.behavior}`);
            return;
        }

        screen.classList.remove('hidden');
        screen.style.display = 'block';

        // Preload assets if required by the behavior block
        if (handler.preload) {
            await handler.preload(config);
        }

        const template = htmlTemplates.querySelector(`[data-secret="${key}"]`);
        const contentHtml = template ? template.innerHTML : `<p>Error: Template for ${key} not found.</p>`;

        // Render DOM layout
        screen.innerHTML = handler.render(config, contentHtml);

        // Attach listeners and behavior events
        handler.attach(screen, key, contactInfo, messageInfo);

        if (config.audio) {
            new Audio(config.audio).play().catch(() => {});
        }
        
        screen.onclick = (e) => {
            e.stopPropagation();
            closeSecret();
        };
    }

    function closeSecret() {
        if (scrollObserver) {
            scrollObserver.disconnect();
            scrollObserver = null;
        }
        stopManicCycle();
        
        const screen = el('secretScreen');
        screen.classList.add('hidden');
        screen.style.display = 'none';
        screen.innerHTML = '';
        currentSecret = null;
    }

    // --- Dialogue Interface Helpers ---

    function addDialogueMessage(character, message, position = 'left', portraitImageUrl = null) {
        const screen = el('secretScreen');
        const thread = screen.querySelector('#dialogueThread');
        if (!thread) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `dialogue-message ${position}`;
        
        const portrait = document.createElement('div');
        portrait.className = 'dialogue-portrait';
        
        if (portraitImageUrl) {
            const img = document.createElement('img');
            img.src = portraitImageUrl;
            img.alt = character;
            portrait.appendChild(img);
        } else {
            portrait.classList.add('no-image');
            portrait.textContent = '[NO IMAGE]';
        }
        
        const textDiv = document.createElement('div');
        textDiv.className = 'dialogue-text';
        
        // const nameSpan = document.createElement('div');
        // nameSpan.className = 'character-name';
        // nameSpan.textContent = character;
        
        const contentSpan = document.createElement('div');
        contentSpan.className = 'message-content';
        contentSpan.textContent = message;
        
        // textDiv.appendChild(nameSpan);
        textDiv.appendChild(contentSpan);
        messageDiv.appendChild(portrait);
        messageDiv.appendChild(textDiv);
        
        thread.appendChild(messageDiv);
        
        setTimeout(() => { thread.scrollTop = thread.scrollHeight; }, 10);
    }

    function clearDialogueThread() {
        const screen = el('secretScreen');
        const thread = screen.querySelector('#dialogueThread');
        if (thread) thread.innerHTML = '';
    }

    // --- File System & Views ---

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

    // --- Public API ---

    return {
        handleSecretRingtone: (code) => {
            const upperCode = code.toUpperCase();
            for (const [key, config] of Object.entries(SECRETS)) {
                if (config.trigger?.type === 'ringtone' && config.trigger.code === upperCode) {
                    openSecret(key);
                    ringtoneModal.classList.add('hidden');
                    return true;
                }
            }
            return false;
        },
        checkNanoChatTrigger: (contact, message) => {
            for (const [key, config] of Object.entries(SECRETS)) {
                if (config.trigger?.type !== 'nanochat' || config.behavior !== 'dialogue') continue;
                
                const incomingContact = contact.toLowerCase().trim();
                const targetContact = config.trigger.contact.toLowerCase().trim();
                const incomingMessage = message.toUpperCase();
                const targetKeyword = config.trigger.keyword;

                if (incomingContact === targetContact && incomingMessage.includes(targetKeyword)) {
                    if (state?.unlockedFeatures) {
                        state.unlockedFeatures[key] = true;
                    }
                    openSecret(key, contact, message);
                    return true;
                }
            }
            return false;
        },
        trigger: (key) => openSecret(key),
        openFilesView: () => { showView('files'); renderFiles(); },
        unlockStardust: () => {
            state.unlockedFeatures.stardust = true;
            state.unlockedFeatures.music = true;
            if (document.getElementById('view-files')?.classList.contains('active')) renderFiles();
        },
        addDialogueMessage,
        clearDialogueThread,
        closeSecret,
        setDialogueHandler: (handler) => { dialogueHandler = handler; }
    };
}