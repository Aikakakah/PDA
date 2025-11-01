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

    const preloadedNotes = {};
    const noteNames = ["a","asharp","b","c","csharp","d","dsharp","e","f","fsharp","g","gsharp"];
    
    for (const n of noteNames) {
        const a = new Audio(`/Audio/${n}.ogg`);
        a.preload = "auto";
        preloadedNotes[n] = a;
    }

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
        if (!views || Object.keys(views).length === 0) return;
        Object.values(views).forEach(x => x?.classList?.remove('active'));
        if (views[v]) views[v].classList.add('active');

        const progHeader = el('progHeader');
        if (progHeader) {
            progHeader.style.display = (v === 'program' ? 'flex' : 'none');
        }
    }

    // --- PageFlip instance ---
    let pageFlipInstance = null;

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
        if (!bookEl) return;

        const rootStyle = getComputedStyle(document.documentElement);
        const bookWidth = parseFloat(rootStyle.getPropertyValue('--book-width'));
        const bookHeight = parseFloat(rootStyle.getPropertyValue('--book-height'));
        const singlePageW = bookWidth / 2;
        const singlePageH = bookHeight;

        let pageFlip = null;
        if (isNaN(singlePageW) || isNaN(singlePageH) || singlePageW < 100) {
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

        const pages = document.querySelectorAll('.my-page');
        if (pages.length) pageFlip.loadFromHTML(pages);

        pageFlipInstance = pageFlip;

        if (bookPrev) bookPrev.addEventListener('click', () => pageFlipInstance?.flipPrev());
        if (bookNext) bookNext.addEventListener('click', () => pageFlipInstance?.flipNext());

        if (pageFlipInstance && typeof pageFlipInstance.on === 'function') {
            pageFlipInstance.on('flip', (e) => updatePageControls(e.object));
            pageFlipInstance.on('init', (e) => updatePageControls(e.object));
            pageFlipInstance.on('load', (e) => updatePageControls(e.object));
        } else {
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
                    setTimeout(() => pdaScreen.classList.remove('shine-active'), 1500);
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
        const programGrid = el('programGrid'); //new
        if (!programGrid) return;
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
        const programArea = el('programArea'); //new
        if (!programArea) return;
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
        const programArea = el('programArea');
        programArea.innerHTML = `
            <div class="cartridge-header">Notekeeper</div>
            <div class="notes-wrap" id="notesWrap"></div>
            <div class="note-input">
                <input id="noteInput" placeholder="Type a note and press Enter" />
                <button id="addNoteBtn">Add</button>
            </div>`;
        const notesWrap = el('notesWrap');
        const noteInput = el('noteInput');
        const addBtn = el('addNoteBtn');

        function refreshNotes() {
            notesWrap.innerHTML = '';
            for (const n of state.notes) {
                const div = document.createElement('div');
                div.className = 'note';
                div.innerHTML = `<span>${n}</span><button>×</button>`;
                div.querySelector('button').addEventListener('click', () => {
                    state.notes = state.notes.filter(x => x !== n);
                    refreshNotes();
                });
                notesWrap.appendChild(div);
            }
        }
        addBtn.onclick = () => {
            const v = noteInput.value.trim();
            if (v) { state.notes.push(v); noteInput.value = ''; refreshNotes(); }
        };
        noteInput.onkeydown = e => { if (e.key === 'Enter') addBtn.click(); };
        refreshNotes();
    }
    // function renderNotekeeper() {
    //     const wrap = document.createElement('div');
    //     wrap.className = 'notekeeper';
    //     wrap.innerHTML = `
    //         <div class="cartridge-header">Notekeeper</div>
    //         <div class="notes-wrap" id="notesWrap"></div>
    //         <div class="note-input">
    //             <input id="noteInput" placeholder="Type a note and press Enter" />
    //             <button id="addNoteBtn">Add</button>
    //         </div>
    //     `;
    //     programArea.appendChild(wrap);

    //     const notesWrap = wrap.querySelector('#notesWrap');
    //     const noteInput = wrap.querySelector('#noteInput');
    //     const addBtn = wrap.querySelector('#addNoteBtn');

    //     function refreshNotes() {
    //         if (!notesWrap) return;
    //         notesWrap.innerHTML = '';
    //         for (const n of state.notes) {
    //             const row = document.createElement('div');
    //             row.className = 'note';
    //             const span = document.createElement('div');
    //             span.textContent = n;
    //             const rem = document.createElement('button');
    //             rem.textContent = '×';
    //             rem.addEventListener('click', () => {
    //                 state.notes = state.notes.filter(x => x !== n);
    //                 refreshNotes();
    //             });
    //             row.appendChild(span);
    //             row.appendChild(rem);
    //             notesWrap.appendChild(row);
    //         }
    //     }

        // addBtn.addEventListener('click', () => {
        //     const v = noteInput.value.trim();
        //     if (!v) return;
        //     state.notes.push(v);
        //     noteInput.value = '';
        //     refreshNotes();
        // });

    //     noteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });

    //     refreshNotes();
    // }

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

    // --- Unlock flow (client-side) ---
    // NOTE: This function assumes you have a secure server-side endpoint (e.g. GitHub Action
    // webhook, Cloudflare Worker, Netlify Function) at /api/unlock that:
    //  - accepts POST { code: "<hash>" }
    //  - validates the code and uses your PRIVATE_REPO_TOKEN server-side to fetch the secret
    //  - returns { ok: true, content: "<secret text or JSON>" } on success
    // Do NOT put tokens in client JS. Implement /api/unlock server-side.

    // SHA256 helper (hex)
    async function sha256Hex(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest("SHA-256", buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    async function checkRingtone(ringtone) {
        // Convert the ringtone array (like [E, E, E, E, E, E]) into a string
        const key = ringtone.map(n => n.toLowerCase()).join('');
        
        // Only fetch if the key matches a known answer
        if (key === 'eeeeee') {
            await loadNewsArticle(key);
        }
    }
    
    let currentArticleIndex = 0;
let articles = []; // Holds all loaded articles (like EEEEEE.json, etc.)

async function loadNewsArticle(key) {
    const url = `https://raw.githubusercontent.com/Aikakakah/Ramona-s-Book/main/${key}.json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load article");
        const article = await res.json();

        // Push to list if not already there
        if (!articles.find(a => a.key === key)) {
            articles.push({ key, ...article });
        }

        currentArticleIndex = articles.findIndex(a => a.key === key);
        renderUnlockedNews(article);
    } catch (err) {
        console.error("Error loading article:", err);
    }
}

function renderUnlockedNews(article) {
    const wrap = document.createElement('div');
    wrap.className = 'station-news';
    wrap.innerHTML = `
        <div class="cartridge-header">Station News Feed</div>
        <div class="news-title">${article.title}</div>
        <div class="news-content">
            <p>${article.content[0]}</p>
            <p class="muted">${article.content[1]}</p>
        </div>
        <div class="news-controls">
            <button id="news-prev" title="Previous"><i class="fas fa-chevron-left"></i></button>
            <button id="news-next" title="Next"><i class="fas fa-chevron-right"></i></button>
            <button id="news-music" title="Play Music"><i class="fas fa-music"></i></button>
        </div>
    `;

    const programArea = document.querySelector('.program-area');
    programArea.innerHTML = ''; // Clear previous page
    programArea.appendChild(wrap);

    // Button handlers
    wrap.querySelector('#news-prev').addEventListener('click', () => changeArticle(-1));
    wrap.querySelector('#news-next').addEventListener('click', () => changeArticle(1));
}

function changeArticle(direction) {
    if (articles.length <= 1) return;

    currentArticleIndex += direction;
    if (currentArticleIndex < 0) currentArticleIndex = articles.length - 1;
    if (currentArticleIndex >= articles.length) currentArticleIndex = 0;

    renderUnlockedNews(articles[currentArticleIndex]);
}

    
    // Call your server-side unlock endpoint with the ringtone code hash
    async function attemptUnlockCurrentRingtone() {
        try {
            // join notes to string (you can choose format — keep consistent with filenames in private repo)
            const ringtoneString = state.settings.ringtone.join("");
            // derive short code — here we use first 12 hex chars (you can adapt)
            const fullHash = await sha256Hex(ringtoneString);
            const code = fullHash.slice(0, 12);

            // POST to your secure server endpoint (you must implement this)
            const resp = await fetch('/api/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (!resp.ok) {
                console.warn('Unlock request failed', resp.status);
                return;
            }

            const body = await resp.json();
            if (body.ok && body.content) {
                displaySecret(body.content);
            } else {
                console.warn('Unlock response denied or empty', body);
            }
        } catch (err) {
            console.error('Unlock attempt error', err);
        }
    }

    // Put unlocked secret into Notekeeper (or anywhere appropriate)
    function displaySecret(secretText) {
        // For now append a special note in Notekeeper and open Notekeeper program
        state.notes.push("🔓 Unlocked: " + (typeof secretText === 'string' ? secretText : JSON.stringify(secretText)));
        // open Notekeeper UI
        openProgram({ uid: 2, name: "Notekeeper", icon: "NK", type: "notekeeper" });
    }
    
    // Play ringtone
    function playRingtone() {
        // Collect current ringtone from the input fields in the modal
        const currentRingtone = Array.from(document.querySelectorAll('.ringtone-note-input')).map(input => input.value.toUpperCase());
        
        // --- The rest of the function remains the same as before, but uses currentRingtone ---
        const notes = currentRingtone;
        if (!notes || notes.length === 0) return;
    
        const RINGTONE_LENGTH = 6;
        const NOTE_TEMPO = 300; // BPM
        const NOTE_DELAY = 60 / NOTE_TEMPO; // 0.2s per note
        const VOLUME = 0.6;
        const AUDIO_PATH = "/Audio/Effects/RingtoneNotes/";
    
        let i = 0;
        const playNext = () => {
            if (i >= notes.length || i >= RINGTONE_LENGTH) return;
    
            const note = notes[i].toLowerCase();
            // Check if the input is a valid note before playing
            if (!preloadedNotes[note]) { 
                i++;
                setTimeout(playNext, NOTE_DELAY * 1000);
                return;
            }
    
            const audio = preloadedNotes[note]?.cloneNode() || new Audio(`${AUDIO_PATH}${note}.ogg`);
            audio.volume = VOLUME;
            audio.play().catch(() => {});
    
            i++;
            setTimeout(playNext, NOTE_DELAY * 1000);
        };
    // Pass the new ringtone to checkRingtone
        checkRingtone(currentRingtone); 
        playNext();
        
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
        if (ringtoneRow && ringtoneModal) {
            // 1. Initial values from state are set in HTML now, so we just wire up the event to show the modal
            ringtoneRow.addEventListener('click', () => {
                // Update the input values in the modal to match the current state on click
                const inputs = document.querySelectorAll('.ringtone-note-input');
                state.settings.ringtone.forEach((note, index) => {
                    if(inputs[index]) inputs[index].value = note;
                });
    
                ringtoneModal.classList.remove('hidden');
            });
        }
        if (closeRingtoneModal) closeRingtoneModal.addEventListener('click', () => ringtoneModal.classList.add('hidden'));
        if (testRingtoneBtn) testRingtoneBtn.addEventListener('click', playRingtone);
        if (setRingtoneBtn) setRingtoneBtn.addEventListener('click', () => {
            alert('Ringtone set to: ' + state.settings.ringtone.join(' - '));
            ringtoneModal.classList.add('hidden');
        });
        if (setRingtoneBtn) setRingtoneBtn.addEventListener('click', () => {
            // 2. Capture the current values from the inputs
            const currentRingtone = Array.from(document.querySelectorAll('.ringtone-note-input')).map(input => input.value.toUpperCase());
            
            // 3. Update the state
            state.settings.ringtone = currentRingtone;
            
            alert('Ringtone set to: ' + state.settings.ringtone.join(' - '));
            ringtoneModal.classList.add('hidden');
        });

        // Initialize PageFlip (safe)
        initializePageFlip();

        // Shine effect
        initializeShineEffect();
    });

})();
