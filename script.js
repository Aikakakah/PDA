// PDA Replica script (fixed / hardened)
(() => {
    // --- State ---
    const state = {
        owner: "Ramona Orthall",
        id: "Ramona Orthall",
        job: "Scientist",
        station: "NTTD Manta Station PR-960",
        alert: "Green",
        instructions: "Don't stray far.",
        currentDate: new Date(),
        shiftStart: Date.now(),
        flashlight: false,
        stylus: false,
        poweredOn: true,
        programs: [
            { uid: 1, name: "Crew manifest", icon: "CM", type: "manifest" },
            { uid: 2, name: "Notekeeper", icon: "NK", type: "notekeeper" },
            { uid: 3, name: "Station news", icon: "News", type: "news" },
            { uid: 4, name: "NanoChat", icon: "NC", type: "nanochat" },
            { uid: 5, name: "Settings", icon: "⛭", type: "settings" }
        ],
        notes: ["Check filter", "Bring gloves"],
        crew: [
            { name: "Sam Nighteyes", rank: "Dignitary", role: "Blueshield Officer" },
            { name: "Claire Vallis", rank: "Command", role: "Captain" },
            { name: "Lexi Tachibana-Hawking", rank: "Command", role: "Head of Personnel" },
            { name: "Ramona Orthall", rank: "Science", role: "Scientist" },
            { name: "Diablo", rank: "Science", role: "Chief Scientist" },
            { name: "Agena Sweets", rank: "Security", role: "Corpsman" },
            { name: "Holds-Head-High", rank: "Security", role: "Junior Officer" },
            { name: "Bonnie Byrne", rank: "Service", role: "Janitor" }
        ],
        nanochat: {
            currentContact: "sam",
            channels: {
                sam: {
                    name: "Sam Nighteyes",
                    messages: [
                        { sender: "Sam", text: "Alert: Unauthorized access detected at Cargo Bay 3. Security on site. Standby for updates.", type: "received" },
                        { sender: "Ramona", text: "Understood. Maintaining distance from the area.", type: "sent" }
                    ]
                },
                batbayar: {
                    name: "Batbayar Le...",
                    messages: [
                        { sender: "Batbayar", text: "Hey Ramona, saw you in the lab. Still working on that warp core analysis?", type: "received" }
                    ]
                }
            }
        },
        settings: {
            ringtone: ["E", "D", "C", "G", "C", "G"]
        },
        book: {
            currentPage: 1,
            maxPages: 6
        }
    };

    // Advance date by ~630 years
    state.currentDate.setFullYear(state.currentDate.getFullYear() + 630);

    // --- Variables that will be assigned after DOM is ready ---
    let pda = null;
    let views = {};
    let tabs = null;
    let programGrid = null;
    let btnLight = null;
    let btnStylus = null;
    let btnFull = null;
    let btnEject = null;
    let powerOverlay = null;
    let powerOn = null;
    let programArea = null;
    let programTitleMini = null;
    let ringtoneRow = null;
    let ringtoneModal = null;
    let closeRingtoneModal = null;
    let ringtoneDisplay = null;
    let testRingtoneBtn = null;
    let setRingtoneBtn = null;
    let bookPrev = null;
    let bookNext = null;
    let pageNumberDisplay = null;

    // Helper to fetch element safely
    const el = id => document.getElementById(id);

    // Quick helpers
    function showView(v) {
        // if views not yet set, fail gracefully
        if (!views || Object.keys(views).length === 0) return;
        Object.values(views).forEach(x => x?.classList?.remove('active'));
        if (views[v]) views[v].classList.add('active');

        // Hide program header if not in a program view (guard if progHeader missing)
        const progHeader = el('progHeader');
        if (progHeader) {
            progHeader.style.display = (v === 'program' ? 'flex' : 'none');
        }
    }

    // --- PageFlip instance ---
    let pageFlipInstance = null;

    // --- Update page controls ---
    const updatePageControls = (pageFlip) => {
        if (!pageFlip) return;
        const bounds = pageFlip.getBounds && pageFlip.getBounds();
        if (!bounds) return;

        try {
            if (bookPrev) bookPrev.disabled = !pageFlip.hasPrevPage();
            if (bookNext) bookNext.disabled = !pageFlip.hasNextPage();
        } catch {
            if (bookPrev) bookPrev.disabled = true;
            if (bookNext) bookNext.disabled = true;
        }

        const currentPageIndex = pageFlip.getCurrentPageIndex ? pageFlip.getCurrentPageIndex() : 0;
        const pageCount = pageFlip.getPageCount ? pageFlip.getPageCount() : 0;

        if (pageNumberDisplay) {
            if (currentPageIndex === 0) {
                pageNumberDisplay.textContent = 'Cover';
            } else if (currentPageIndex === pageCount - 1) {
                pageNumberDisplay.textContent = 'Back Cover';
            } else {
                pageNumberDisplay.textContent = `Page ${currentPageIndex + 1} / ${pageCount}`;
            }
        }
    };

    const initializePageFlip = () => {
        const bookEl = el('book');
        if (!bookEl) {
            console.warn('initializePageFlip: #book element not found.');
            return;
        }

        const rootStyle = getComputedStyle(document.documentElement);
        const bookWidth = parseFloat(rootStyle.getPropertyValue('--book-width'));
        const bookHeight = parseFloat(rootStyle.getPropertyValue('--book-height'));
        const singlePageW = bookWidth / 2;
        const singlePageH = bookHeight;

        let pageFlip = null;

        // If computed values are invalid, fallback to defaults
        if (isNaN(singlePageW) || isNaN(singlePageH) || singlePageW < 100) {
            console.warn("PageFlip initialization: invalid CSS size; using fallback sizes.");
            const scaleFactor = parseFloat(rootStyle.getPropertyValue('--scale-factor')) || 1;
            const fallbackW = 1104 * scaleFactor;
            const fallbackH = 1452 * scaleFactor;

            pageFlip = new St.PageFlip(bookEl, {
                width: fallbackW,
                height: fallbackH,
                startPage: 0,
                size: 'fixed',
                drawShadow: true,
                maxShadowOpacity: 0.5,
                showCover: true,
                flippingTime: 700
            });
        } else {
            pageFlip = new St.PageFlip(bookEl, {
                width: singlePageW,
                height: singlePageH,
                startPage: 0,
                size: 'fixed',
                drawShadow: true,
                maxShadowOpacity: 0.35,
                showCover: true,
                flippingTime: 700
            });
        }

        // Load pages (safe query)
        const pages = document.querySelectorAll('.my-page');
        if (pages.length) pageFlip.loadFromHTML(pages);

        pageFlipInstance = pageFlip;

        // Wire up buttons if present
        if (bookPrev) bookPrev.addEventListener('click', () => pageFlipInstance?.flipPrev());
        if (bookNext) bookNext.addEventListener('click', () => pageFlipInstance?.flipNext());

        // Update controls on events (guard if pageFlipInstance lacks .on)
        if (pageFlipInstance && typeof pageFlipInstance.on === 'function') {
            pageFlipInstance.on('flip', (e) => updatePageControls(e.object));
            pageFlipInstance.on('init', (e) => updatePageControls(e.object));
            pageFlipInstance.on('load', (e) => updatePageControls(e.object));
        } else {
            // Fallback immediate update
            updatePageControls(pageFlipInstance);
        }
    };

    // SHINE EFFECT
    const initializeShineEffect = () => {
        const pdaScreen = document.querySelector('.PDA-screen');
        const COOLDOWN_MS = 60 * 1000;
        let lastPlayed = 0;

        if (pdaScreen) {
            pdaScreen.addEventListener('mouseenter', () => {
                const now = Date.now();
                if (now - lastPlayed > COOLDOWN_MS) {
                    lastPlayed = now;
                    pdaScreen.classList.add('shine-active');
                    const animationDurationMs = 1500;
                    setTimeout(() => pdaScreen.classList.remove('shine-active'), animationDurationMs);
                } else {
                    // cooldown - do nothing
                }
            });
        }
    };

    // HOME view update
    function updateHome() {
        if (el('owner')) el('owner').textContent = state.owner;
        if (el('idline')) el('idline').innerHTML = `${state.id}, <span id="job" class="job">${state.job}</span>`;
        if (el('station')) el('station').textContent = state.station;
        if (el('instructions')) el('instructions').textContent = state.instructions;
        if (el('date')) el('date').textContent = state.currentDate.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });

        const alertEl = el('alert');
        if (alertEl) {
            alertEl.textContent = state.alert;
            alertEl.className = 'alert ' + state.alert.toLowerCase();
        }

        const shiftEl = el('shift');
        if (shiftEl) {
            const elapsed = Date.now() - state.shiftStart;
            const hh = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
            const mm = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
            const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
            shiftEl.textContent = `${hh}:${mm}:${ss}`;
        }
    }

    // --- PROGRAM LOGIC ---
    function renderPrograms() {
        if (!programGrid) {
            console.warn('renderPrograms: #programGrid not found.');
            return;
        }
        programGrid.innerHTML = '';
        for (const p of state.programs) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.uid = p.uid;
            tile.innerHTML = `<div class="glyph">${p.icon}</div><div class="label">${p.name}</div>`;
            tile.addEventListener('click', () => openProgram(p));
            programGrid.appendChild(tile);
        }
    }

    function openProgram(p) {
        // ensure programArea exists
        if (!programArea) {
            console.warn('openProgram: programArea not found.');
            return;
        }

        showView('program');
        programArea.innerHTML = '';

        switch (p.type) {
            case 'notekeeper': renderNotekeeper(); break;
            case 'manifest': renderManifest(); break;
            case 'nanochat': renderNanoChat(); break;
            case 'news': renderStationNews(); break;
            case 'settings':
                showView('settings');
                document.querySelectorAll('.nav-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
                const ts = el('tab-settings'); if (ts) ts.setAttribute('aria-pressed', 'true');
                break;
            default:
                programArea.innerHTML = `<div class="cartridge-header">${p.name}</div><div class="muted">This cartridge is simulated.</div>`;
        }
    }

    // Notekeeper
    function renderNotekeeper() {
        const wrap = document.createElement('div');
        wrap.className = 'notekeeper';
        wrap.innerHTML = `
            <div class="cartridge-header">Notekeeper</div>
            <div class="notes-wrap" id="notesWrap"></div>
            <div class="note-input">
                <input id="noteInput" placeholder="Type a note and press Enter" />
                <button id="addNoteBtn">Add</button>
            </div>
        `;
        programArea.appendChild(wrap);

        const notesWrap = wrap.querySelector('#notesWrap');
        const noteInput = wrap.querySelector('#noteInput');
        const addBtn = wrap.querySelector('#addNoteBtn');

        function refreshNotes() {
            if (!notesWrap) return;
            notesWrap.innerHTML = '';
            for (const n of state.notes) {
                const row = document.createElement('div');
                row.className = 'note';
                const span = document.createElement('div');
                span.textContent = n;
                const rem = document.createElement('button');
                rem.textContent = '×';
                rem.addEventListener('click', () => {
                    state.notes = state.notes.filter(x => x !== n);
                    refreshNotes();
                });
                row.appendChild(span);
                row.appendChild(rem);
                notesWrap.appendChild(row);
            }
        }

        addBtn.addEventListener('click', () => {
            const v = noteInput.value.trim();
            if (!v) return;
            state.notes.push(v);
            noteInput.value = '';
            refreshNotes();
        });

        noteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });

        refreshNotes();
    }

    // Manifest
    function renderManifest() {
        const wrap = document.createElement('div');
        wrap.className = 'crew-manifest';
        wrap.innerHTML = `<div class="cartridge-header">${state.station} Crew Manifest</div><div class="manifest-list" id="manifestList"></div>`;
        programArea.appendChild(wrap);
        const manifestList = wrap.querySelector('#manifestList');

        const groupedCrew = state.crew.reduce((acc, member) => {
            acc[member.rank] = acc[member.rank] || [];
            acc[member.rank].push(member);
            return acc;
        }, {});

        for (const rank in groupedCrew) {
            const rankHeader = document.createElement('h4');
            rankHeader.textContent = rank;
            manifestList.appendChild(rankHeader);

            groupedCrew[rank].forEach(member => {
                const entry = document.createElement('div');
                entry.className = 'manifest-entry';
                entry.innerHTML = `
                    <div class="name">${member.name}</div>
                    <div class="role"><span class="rank">${member.rank}</span>: ${member.role}</div>
                `;
                manifestList.appendChild(entry);
            });
        }
    }

    // NanoChat
    function renderNanoChat() {
        const wrap = document.createElement('div');
        wrap.className = 'nanochat';
        wrap.innerHTML = `
            <div class="chat-header">NanoChat</div>
            <div class="chat-body">
                <div class="chat-sidebar" id="chatSidebar"></div>
                <div class="chat-messages" id="chatMessages"></div>
            </div>
            <div class="chat-input-wrap">
                <input id="chatInput" placeholder="Message ${state.nanochat.channels[state.nanochat.currentContact].name}..." />
                <button id="chatSendBtn"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;
        programArea.appendChild(wrap);

        const sidebar = el('chatSidebar');
        const messagesContainer = el('chatMessages');
        const input = el('chatInput');
        const sendBtn = el('chatSendBtn');

        function renderSidebar() {
            if (!sidebar) return;
            sidebar.innerHTML = '';
            for (const contactId in state.nanochat.channels) {
                const channel = state.nanochat.channels[contactId];
                const contactDiv = document.createElement('div');
                contactDiv.classList.add('chat-contact');
                contactDiv.textContent = channel.name;
                contactDiv.dataset.contactId = contactId;
                if (contactId === state.nanochat.currentContact) {
                    contactDiv.classList.add('active');
                    if (input) input.placeholder = `Message ${channel.name}...`;
                }
                contactDiv.addEventListener('click', () => {
                    state.nanochat.currentContact = contactId;
                    renderSidebar();
                    renderMessages();
                });
                sidebar.appendChild(contactDiv);
            }
        }

        function renderMessages() {
            if (!messagesContainer) return;
            messagesContainer.innerHTML = '';
            const messages = state.nanochat.channels[state.nanochat.currentContact].messages || [];

            messages.forEach(msg => {
                const row = document.createElement('div');
                row.className = 'message-row ' + msg.type;
                row.innerHTML = `<div class="message-bubble ${msg.type}">${msg.text}</div>`;
                messagesContainer.appendChild(row);
            });

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function sendMessage() {
            if (!input) return;
            const text = input.value.trim();
            if (text) {
                state.nanochat.channels[state.nanochat.currentContact].messages.push({
                    sender: state.owner,
                    text: text,
                    type: "sent"
                });
                input.value = '';
                renderMessages();
            }
        }

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

        renderSidebar();
        renderMessages();
    }

    // Station News
    function renderStationNews() {
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
                <button title="Previous"><i class="fas fa-chevron-left"></i></button>
                <button title="Next"><i class="fas fa-chevron-right"></i></button>
                <button title="Play Music"><i class="fas fa-music"></i></button>
            </div>
        `;
        programArea.appendChild(wrap);
    }

    
    // Play ringtone
    function playRingtone() {
        const notes = state.settings.ringtone;
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const noteDurations = { "E": 200, "D": 200, "C": 200, "G": 200 };
        const noteFrequencies = {
            "C": 261.63, "C#": 277.18,
            "D": 293.66, "D#": 311.13,
            "E": 329.63,
            "F": 349.23, "F#": 369.99,
            "G": 392.00, "G#": 415.30,
            "A": 440.00, "A#": 466.16,
            "B": 493.88
          };

        let delay = 0;
        notes.forEach(noteName => {
            const frequency = noteFrequencies[noteName];
            const duration = noteDurations[noteName];

            if (frequency && duration) {
                setTimeout(() => {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
                    oscillator.connect(audioCtx.destination);
                    oscillator.start();
                    setTimeout(() => {
                        oscillator.stop();
                        setTimeout(() => audioCtx.close(), 10);
                    }, duration);
                }, delay);
                delay += duration + 50;
            }
        });
    }

    // --- INITIALIZATION after DOM ready ---
    document.addEventListener('DOMContentLoaded', () => {
        // assign elements now that DOM exists
        pda = el('pda');
        views = {
            home: el('view-home'),
            programs: el('view-programs'),
            settings: el('view-settings'),
            program: el('view-program')
        };
        tabs = document.querySelectorAll('.nav-btn');
        programGrid = el('programGrid');
        btnLight = el('btn-light');
        btnStylus = el('btn-stylus');
        btnFull = el('btn-full');
        btnEject = el('btn-eject');
        powerOverlay = el('powerOverlay');
        powerOn = el('powerOn');
        programArea = el('programArea');
        programTitleMini = el('programTitleMini');
        ringtoneRow = el('ringtoneRow');
        ringtoneModal = el('ringtoneModal');
        closeRingtoneModal = el('closeRingtoneModal');
        ringtoneDisplay = el('ringtoneDisplay');
        testRingtoneBtn = el('testRingtoneBtn');
        setRingtoneBtn = el('setRingtoneBtn');
        bookPrev = el('bookPrev');
        bookNext = el('bookNext');
        pageNumberDisplay = el('pageNumber');

        // Render programs (safe)
        renderPrograms();

        // Default show home (or change to 'programs' if you prefer to show that tab by default)
        showView('home');

        // Home updater
        setInterval(updateHome, 1000);
        updateHome();

        // Wire up tab clicks (guard tabs)
        if (tabs && tabs.length) {
            tabs.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.dataset.tab;
                    document.querySelectorAll('.nav-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
                    btn.setAttribute('aria-pressed', 'true');
                    if (programTitleMini) programTitleMini.classList.add('hidden');
                    if (tab) showView(tab);
                });
            });
        }

        // Stylus toggle (guard)
        if (btnStylus) {
            btnStylus.addEventListener('click', () => {
                state.stylus = !state.stylus;
                btnStylus.setAttribute('aria-pressed', String(state.stylus));
            });
        }

        // Fullscreen
        if (btnFull && pda) {
            btnFull.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    pda.requestFullscreen?.();
                } else {
                    document.exitFullscreen?.();
                }
            });
        }

        // Power / Eject
        if (btnEject && powerOverlay && pda) {
            btnEject.addEventListener('click', () => {
                powerOverlay.classList.remove('hidden');
                pda.classList.add('powered-off');
                state.poweredOn = false;
            });
        }
        if (powerOn && powerOverlay && pda) {
            powerOn.addEventListener('click', () => {
                powerOverlay.classList.add('hidden');
                pda.classList.remove('powered-off');
                state.poweredOn = true;
            });
        }

        // Ringtone modal
        if (ringtoneRow && ringtoneModal && ringtoneDisplay) {
            ringtoneRow.addEventListener('click', () => {
                ringtoneDisplay.innerHTML = state.settings.ringtone.map(note => `<span>${note}</span>`).join('');
                ringtoneModal.classList.remove('hidden');
            });
        }
        if (closeRingtoneModal) closeRingtoneModal.addEventListener('click', () => ringtoneModal.classList.add('hidden'));
        if (testRingtoneBtn) testRingtoneBtn.addEventListener('click', playRingtone);
        if (setRingtoneBtn) setRingtoneBtn.addEventListener('click', () => {
            alert('Ringtone set to: ' + state.settings.ringtone.join(' - '));
            ringtoneModal.classList.add('hidden');
        });

        // Initialize PageFlip (safe)
        initializePageFlip();

        // Shine effect
        initializeShineEffect();
    });

})();
