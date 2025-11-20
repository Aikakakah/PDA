import { createNewsModule } from './news.js';
import { createSecretHandler } from './secret_handler.js';

(() => {
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
            ringtone: ["A", "A", "A", "A", "A", "G"]
        },
        book: {
            currentPage: 1,
            maxPages: 6
        },
        // State property for news is now here, used by the news module
        unlockedNews: null 
    };

    const preloadedNotes = {};
    const noteNames = ["a","asharp","b","c","csharp","d","dsharp","e","f","fsharp","g","gsharp"];
    
    // Adjusted path for local development
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
    let ringtoneModal = null; // Declared for passing to news module
    let closeRingtoneModal = null;
    let ringtoneDisplay = null;
    let testRingtoneBtn = null;
    let setRingtoneBtn = null;
    let bookPrev = null;
    let bookNext = null;
    let pageNumberDisplay = null;
    let nanochatModal = null;
    let closeNanochatModal = null; // <- added declaration

    let newsModule = null; // Variable to hold the instantiated news module
    let secretHandler = null;

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

    // --- FLOATING NOTES SYSTEM ---
    const floatingNotes = new Map(); // Store floating notes by ID
    let draggedNoteId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function initializeBookNotes() {
        const bookNotes = document.querySelectorAll('.book-note');
        
        bookNotes.forEach(note => {
            note.addEventListener('mousedown', handleNoteMouseDown);
        });
    }

    function handleNoteMouseDown(e) {
        if (e.button !== 0) return; // Only left click
        
        const noteId = this.dataset.noteId;
        const rect = this.getBoundingClientRect();
        
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        // Check if note is already floating
        if (floatingNotes.has(noteId)) {
            // Drag existing floating note
            draggedNoteId = noteId;
            const floatingNote = floatingNotes.get(noteId);
            floatingNote.classList.add('dragging');
            document.addEventListener('mousemove', handleNoteDrag);
            document.addEventListener('mouseup', handleNoteMouseUp);
        } else {
            // Create floating note by dragging
            draggedNoteId = noteId;
            this.classList.add('dragging');
            document.addEventListener('mousemove', handleNoteDrag);
            document.addEventListener('mouseup', handleNoteMouseUp);
        }
        
        e.preventDefault();
    }

    function handleNoteDrag(e) {
        if (!draggedNoteId) return;
        
        const noteId = draggedNoteId;
        let floatingNote = floatingNotes.get(noteId);
        const bookWidget = document.querySelector('.book-widget');
        
        // Create floating note if it doesn't exist
        if (!floatingNote) {
            const bookNote = document.querySelector(`[data-note-id="${noteId}"]`);
            if (!bookNote) return;
            
            floatingNote = document.createElement('div');
            floatingNote.className = 'floating-note dragging';
            floatingNote.textContent = bookNote.textContent;
            floatingNote.dataset.noteId = noteId;
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'floating-note-close';
            closeBtn.innerHTML = '✕';
            closeBtn.addEventListener('click', () => removeFloatingNote(noteId));
            floatingNote.appendChild(closeBtn);
            
            const container = el('floatingNotesContainer');
            if (container) container.appendChild(floatingNote);
            
            floatingNotes.set(noteId, floatingNote);
            
            // Hide the original book note
            bookNote.style.display = 'none';
            
            // Attach drag handler to floating note
            floatingNote.addEventListener('mousedown', handleFloatingNoteMouseDown);
        }
        
        // Calculate position relative to book widget
        if (bookWidget) {
            const bookRect = bookWidget.getBoundingClientRect();
            const relX = e.clientX - bookRect.left - dragOffsetX;
            const relY = e.clientY - bookRect.top - dragOffsetY;
            
            floatingNote.style.left = relX + 'px';
            floatingNote.style.top = relY + 'px';
        } else {
            floatingNote.style.left = (e.clientX - dragOffsetX) + 'px';
            floatingNote.style.top = (e.clientY - dragOffsetY) + 'px';
        }
        
        e.preventDefault();
    }

    function handleFloatingNoteMouseDown(e) {
        if (e.button !== 0) return; // Only left click
        if (e.target.classList.contains('floating-note-close')) return; // Don't drag if clicking close button
        
        const noteId = this.dataset.noteId;
        const rect = this.getBoundingClientRect();
        
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        draggedNoteId = noteId;
        this.classList.add('dragging');
        document.addEventListener('mousemove', handleNoteDrag);
        document.addEventListener('mouseup', handleNoteMouseUp);
        
        e.preventDefault();
    }

    function removeFloatingNote(noteId) {
        const floatingNote = floatingNotes.get(noteId);
        const bookNote = document.querySelector(`[data-note-id="${noteId}"]`);
        
        if (floatingNote) {
            floatingNote.remove();
            floatingNotes.delete(noteId);
        }
        
        // Show the original book note again
        if (bookNote) {
            bookNote.style.display = '';
        }
    }

    function handleNoteMouseUp(e) {
        if (!draggedNoteId) return;
        
        const noteId = draggedNoteId;
        const bookNote = document.querySelector(`[data-note-id="${noteId}"]`);
        const floatingNote = floatingNotes.get(noteId);
        
        if (bookNote) bookNote.classList.remove('dragging');
        if (floatingNote) floatingNote.classList.remove('dragging');
        
        document.removeEventListener('mousemove', handleNoteDrag);
        document.removeEventListener('mouseup', handleNoteMouseUp);
        
        draggedNoteId = null;
    }

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
        const programGrid = el('programGrid'); 
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
        const programArea = el('programArea'); 
        if (!programArea) return;
        showView('program');
        programArea.innerHTML = '';

        switch (p.type) {
            case 'notekeeper': renderNotekeeper(); break;
            case 'manifest': renderManifest(); break;
            case 'nanochat': renderNanoChat(); break;
            case 'news': 
                if (newsModule) newsModule.renderNewsProgram(); // Calls news.js logic
                break;
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
    // Notekeeper
    function renderNotekeeper() {
        const programArea = el('programArea');
        // ADDED wrapper class 'notekeeper-container'
        programArea.innerHTML = `
            <div class="notekeeper-container">
                <div class="cartridge-header">Notekeeper</div>
                <div class="notes-wrap" id="notesWrap"></div>
                <div class="note-input">
                    <input id="noteInput" placeholder="Type a note and press Enter" />
                    <button id="addNoteBtn">Add</button>
                </div>
            </div>`; // END wrapper

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
    const programArea = el('programArea');
    const wrap = document.createElement('div');
    wrap.className = 'nanochat nanochat-container';
    wrap.innerHTML = `
        <div class="chat-header">NanoChat
            <div class="right">
                <button class="new-chat-btn" id="newChatBtn" title="New Chat" aria-pressed="false" title="New Chat">
                    <svg width="18" height="18" aria-hidden><path fill="currentColor" d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/></svg>
                </button>
            </div>
        </div>
        <div class="chat-body">
            <div class="chat-sidebar" id="chatSidebar"></div>
            <div class="chat-messages" id="chatMessages"></div>
        </div>
        <div class="chat-input-wrap">
            <input id="chatInput" placeholder="Message ${state.nanochat.channels[state.nanochat.currentContact].name}..." />
            <button id="chatSendBtn"><i class="fas fa-paper-plane"></i></button>
        </div>

        <div id="newChatModal" class="nanochat-modal hidden">
            <div class="modal-content">
                <div class="modal-title">New Contact</div>
                <input type="text" id="newContactName" placeholder="Contact Name" maxlength="20">
                <input type="text" id="newContactNumber" placeholder="Number" maxlength="10">
                <div class="modal-actions">
                    <button id="cancelNewChatBtn">Cancel</button>
                    <button id="createNewChatBtn" class="action-btn">Create</button>
                </div>
            </div>
        </div>
        `;
    programArea.appendChild(wrap);

    const sidebar = el('chatSidebar');
    const messagesContainer = el('chatMessages');
    const input = el('chatInput');
    const sendBtn = el('chatSendBtn');
    
    // Element References for the New Contact Modal
    const newChatBtn = el('newChatBtn'); // The nanochat-specific new chat button
    const newChatModal = el('newChatModal');
    const cancelBtn = el('cancelNewChatBtn');
    const createBtn = el('createNewChatBtn');
    const contactNameInput = el('newContactName');
    const contactNumberInput = el('newContactNumber');
    
    // --- NEW MODAL LOGIC (Show/Hide/Create) ---
    newChatBtn.addEventListener('click', () => {
        newChatModal.classList.remove('hidden');
        contactNameInput.focus();
    });

    cancelBtn.addEventListener('click', () => {
        newChatModal.classList.add('hidden');
        contactNameInput.value = '';
        contactNumberInput.value = '';
    });

    createBtn.addEventListener('click', () => {
        const name = contactNameInput.value.trim();
        const number = contactNumberInput.value.trim();
        
        if (name && number) {
            // Placeholder: Add your actual contact creation logic here
            // (e.g., updating state.nanochat.channels)
            console.log(`Attempting to create new chat with: ${name} (${number})`);
            
            newChatModal.classList.add('hidden');
            contactNameInput.value = '';
            contactNumberInput.value = '';
        } else {
            alert('Please enter both a name and a number.');
        }
    });
    // --- END NEW MODAL LOGIC ---


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
    
    // Play ringtone and check for news trigger
    // Play ringtone and check for news trigger
    // script.js (Modified playRingtone function)

    // Play ringtone and check for news trigger
    // Play ringtone and check for news trigger
function playRingtone() {
    // Collect current ringtone from the input fields in the modal
    const currentRingtone = Array.from(document.querySelectorAll('.ringtone-note-input')).map(input => input.value.toUpperCase());
    
    const notes = currentRingtone;
    if (!notes || notes.length === 0) return;

    const RINGTONE_LENGTH = 6;
    const NOTE_TEMPO = 300; // BPM
    const NOTE_DELAY = 60 / NOTE_TEMPO; // 0.2s per note
    const VOLUME = 0.6;
    const AUDIO_PATH = "/Audio/Effects/RingtoneNotes/";
    
    // **********************************************
    // New: Check for news article or secret trigger
    const key = notes.map(n => n.toLowerCase()).join('');

    // 1. Check for the Secret Code first
    if (secretHandler.handleSecretRingtone(key)) {
         // If the secret code was triggered and handled, exit early.
         // The secret handler manages the visuals (SandyStars.png).
         return; 
    }
    
    // 2. Check for news article trigger using the module
    if (newsModule) newsModule.handleNewsArticle(key); 
    // **********************************************

    let i = 0;
    const playNext = () => {
        if (i >= notes.length || i >= RINGTONE_LENGTH) return;
    
        const inputNote = notes[i].toUpperCase();
        let note;

        // Logic to handle sharp notes (e.g., C# is converted to 'csharp')
        if (inputNote.length > 1 && inputNote.endsWith('#')) {
            note = inputNote[0].toLowerCase() + 'sharp';
        } else {
            // Handle natural notes (e.g., C is converted to 'c')
            note = inputNote[0]?.toLowerCase();
        }

        // Fallback for invalid characters or empty input
        if (!note) {
            i++;
            setTimeout(playNext, NOTE_DELAY * 1000);
            return;
        }

        // Check if the note is a valid note before playing
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
        nanochatModal = el('nanochatModal');
        closeNanochatModal = el('closeNanochatModal'); // <- fixed typo
        ringtoneRow = el('ringtoneRow');
        ringtoneModal = el('ringtoneModal');
        closeRingtoneModal = el('closeRingtoneModal');
        ringtoneDisplay = el('ringtoneDisplay');
        testRingtoneBtn = el('testRingtoneBtn');
        setRingtoneBtn = el('setRingtoneBtn');
        bookPrev = el('bookPrev');
        bookNext = el('bookNext');
        pageNumberDisplay = el('pageNumber');
        
        // Initialize the News Module, passing the shared state and helper functions/elements
        newsModule = createNewsModule(state, el, showView, ringtoneModal);

        secretHandler = createSecretHandler(el, showView, ringtoneModal);
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
        const selectAllText = (event) => {
            event.target.select();
        };

        // Attach auto-select listener to all ringtone input fields
        const ringtoneInputs = document.querySelectorAll('.ringtone-note-input');
        ringtoneInputs.forEach(input => {
            input.addEventListener('focus', selectAllText);
        });
        // --- END NEW CODE ---

        // Ringtone modal
        if (ringtoneRow && ringtoneModal) {
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
            // 2. Capture the current values from the inputs
            const currentRingtone = Array.from(document.querySelectorAll('.ringtone-note-input')).map(input => input.value.toUpperCase());
            
            // 3. Update the state
            state.settings.ringtone = currentRingtone;
            
            // alert('Ringtone set to: ' + state.settings.ringtone.join(' - '));
            ringtoneModal.classList.add('hidden');
            
            // Re-check the ringtone immediately after setting it
            playRingtone();
        });

        // Initialize PageFlip (safe)
        initializePageFlip();

        // Shine effect
        initializeShineEffect();

        // Initialize book notes dragging
        initializeBookNotes();
    });

})();