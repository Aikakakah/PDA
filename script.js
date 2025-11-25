
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
            unlockedFeatures: {
                notekeeper: false,
                nanochat: false,
                news: false,
                ringtone: false,
                power: false // We track power here too now for consistency
            },
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
            unlockedNews: null 
        };
    
        const preloadedNotes = {};
        const noteNames = ["a","asharp","b","c","csharp","d","dsharp","e","f","fsharp","g","gsharp"];
        
        for (const n of noteNames) {
            const a = new Audio(`/Audio/${n}.ogg`);
            a.preload = "auto";
            preloadedNotes[n] = a;
        }
    
        state.currentDate.setFullYear(state.currentDate.getFullYear() + 630);
    
        // --- Variables ---
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
        let nanochatModal = null;
        let closeNanochatModal = null;
        let backPanel = null; // Made global for easier access
    
        let newsModule = null;
        let secretHandler = null;
    
        const el = id => document.getElementById(id);
    
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
        const floatingNotes = new Map(); 
        let draggedNoteId = null;
        let dragOffsetX = 0;
        let dragOffsetY = 0;
    
        function initializeBookNotes() {
            const bookNotes = document.querySelectorAll('.book-note');
            
            bookNotes.forEach(note => {
                note.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return; 
                    e.preventDefault();
                    e.stopPropagation(); 
                    createFloatingNoteFrom(note, e.clientX, e.clientY);
                });
            });
        }
    
        function createFloatingNoteFrom(originalNote, startX, startY) {
            const rect = originalNote.getBoundingClientRect();
            
            const clone = document.createElement('div');
            clone.classList.add('floating-note');
            clone.textContent = originalNote.textContent;
            clone.dataset.originalId = originalNote.dataset.noteId; 
            
            clone.style.left = rect.left + 'px';
            clone.style.top = rect.top + 'px';
            
            document.body.appendChild(clone);
    
            originalNote.style.visibility = 'hidden';
            originalNote.style.opacity = '0';
    
            const offsetX = startX - rect.left;
            const offsetY = startY - rect.top;
    
            startDraggingFloatingNote(clone, originalNote, offsetX, offsetY);
        }
    
        function startDraggingFloatingNote(clone, originalNote, offsetX, offsetY) {
            
            const onMouseMove = (e) => {
                clone.style.left = (e.clientX - offsetX) + 'px';
                clone.style.top = (e.clientY - offsetY) + 'px';
            };
    
            const onMouseUp = (e) => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
    
                clone.style.display = 'none';
                const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
                clone.style.display = 'flex'; 
    
                const targetPage = elementBelow ? elementBelow.closest('.my-page') : null;
    
                if (targetPage) {
                    const pageRect = targetPage.getBoundingClientRect();
                    const cloneRect = clone.getBoundingClientRect();
                    
                    const noteWidth = cloneRect.width;
                    const noteHeight = cloneRect.height;
                    const pageWidth = pageRect.width;
                    const pageHeight = pageRect.height;
                    const padding = 5; 
    
                    let relativeLeft = cloneRect.left - pageRect.left;
                    let relativeTop = cloneRect.top - pageRect.top;
    
                    relativeLeft = Math.max(padding, Math.min(relativeLeft, pageWidth - noteWidth - padding));
                    relativeTop = Math.max(padding, Math.min(relativeTop, pageHeight - noteHeight - padding));
    
                    originalNote.style.left = relativeLeft + 'px';
                    originalNote.style.top = relativeTop + 'px';
                    
                    originalNote.style.transform = 'none';
    
                    targetPage.appendChild(originalNote);
                    
                    originalNote.style.visibility = 'visible';
                    originalNote.style.opacity = '1';
                    
                    clone.remove();
                    
                } else {
                    clone.style.pointerEvents = 'auto';
                    clone.onmousedown = (evt) => {
                        if (evt.button !== 0) return;
                        evt.preventDefault();
                        const newRect = clone.getBoundingClientRect();
                        startDraggingFloatingNote(clone, originalNote, evt.clientX - newRect.left, evt.clientY - newRect.top);
                    };
                }
            };
    
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    
        function handleNoteMouseDown(e) {
            if (e.button !== 0) return; 
            
            const noteId = this.dataset.noteId;
            const rect = this.getBoundingClientRect();
            
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            if (floatingNotes.has(noteId)) {
                draggedNoteId = noteId;
                const floatingNote = floatingNotes.get(noteId);
                floatingNote.classList.add('dragging');
                document.addEventListener('mousemove', handleNoteDrag);
                document.addEventListener('mouseup', handleNoteMouseUp);
            } else {
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
            
            if (!floatingNote) {
                const bookNote = document.querySelector(`[data-note-id="${noteId}"]`);
                if (!bookNote) return;
                
                floatingNote = document.createElement('div');
                floatingNote.className = 'floating-note dragging';
                floatingNote.textContent = bookNote.textContent;
                floatingNote.dataset.noteId = noteId;
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'floating-note-close';
                closeBtn.innerHTML = '✕';
                closeBtn.addEventListener('click', () => removeFloatingNote(noteId));
                floatingNote.appendChild(closeBtn);
                
                const container = el('floatingNotesContainer');
                if (container) container.appendChild(floatingNote);
                
                floatingNotes.set(noteId, floatingNote);
                
                bookNote.style.display = 'none';
                
                floatingNote.addEventListener('mousedown', handleFloatingNoteMouseDown);
            }
            
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
            if (e.button !== 0) return; 
            if (e.target.classList.contains('floating-note-close')) return; 
            
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
            
            if (bookNote) {
                bookNote.style.display = '';
            }
        }
    
        function handleNoteMouseUp(e) {
            if (!draggedNoteId) return;
            
            const noteId = draggedNoteId;
            const bookWidget = document.querySelector('.book-widget');
            const bookRect = bookWidget.getBoundingClientRect();
            
            const isOverBook = (
                e.clientX >= bookRect.left &&
                e.clientX <= bookRect.right &&
                e.clientY >= bookRect.top &&
                e.clientY <= bookRect.bottom
            );
    
            if (isOverBook) {
                removeFloatingNote(noteId);
                draggedNoteId = null; 
                document.removeEventListener('mousemove', handleNoteDrag);
                document.removeEventListener('mouseup', handleNoteMouseUp);
                return; 
            }
    
            const floatingNote = floatingNotes.get(noteId);
            if (floatingNote) floatingNote.classList.remove('dragging');
            
            document.removeEventListener('mousemove', handleNoteDrag);
            document.removeEventListener('mouseup', handleNoteMouseUp);
            
            draggedNoteId = null;
        }
    
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
                    if (newsModule) newsModule.renderNewsProgram(); 
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
    
        function renderNotekeeper() {
            const programArea = el('programArea');
            programArea.innerHTML = `
                <div class="notekeeper-container">
                    <div class="cartridge-header">Notekeeper</div>
                    <div class="notes-wrap" id="notesWrap"></div>
                    <div class="note-input">
                        <input id="noteInput" placeholder="Type a note and press Enter" />
                        <button id="addNoteBtn">Add</button>
                    </div>
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
        
        const newChatBtn = el('newChatBtn'); 
        const newChatModal = el('newChatModal');
        const cancelBtn = el('cancelNewChatBtn');
        const createBtn = el('createNewChatBtn');
        const contactNameInput = el('newContactName');
        const contactNumberInput = el('newContactNumber');
        
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
                console.log(`Attempting to create new chat with: ${name} (${number})`);
                newChatModal.classList.add('hidden');
                contactNameInput.value = '';
                contactNumberInput.value = '';
            } else {
                alert('Please enter both a name and a number.');
            }
        });
    
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
        
        function playRingtone() {
            const currentRingtone = Array.from(document.querySelectorAll('.ringtone-note-input')).map(input => input.value.toUpperCase());
            
            const notes = currentRingtone;
            if (!notes || notes.length === 0) return;
    
            const RINGTONE_LENGTH = 6;
            const NOTE_TEMPO = 300; 
            const NOTE_DELAY = 60 / NOTE_TEMPO; 
            const VOLUME = 0.6;
            const AUDIO_PATH = "/Audio/Effects/RingtoneNotes/";
            
            const key = notes.map(n => n.toLowerCase()).join('');
    
            if (secretHandler.handleSecretRingtone(key)) {
                 return; 
            }
            
            if (newsModule) newsModule.handleNewsArticle(key); 
            
            let i = 0;
            const playNext = () => {
                if (i >= notes.length || i >= RINGTONE_LENGTH) return;
            
                const inputNote = notes[i].toUpperCase();
                let note;
    
                if (inputNote.length > 1 && inputNote.endsWith('#')) {
                    note = inputNote[0].toLowerCase() + 'sharp';
                } else {
                    note = inputNote[0]?.toLowerCase();
                }
    
                if (!note) {
                    i++;
                    setTimeout(playNext, NOTE_DELAY * 1000);
                    return;
                }
    
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
    
        document.addEventListener('DOMContentLoaded', () => {
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
            closeNanochatModal = el('closeNanochatModal'); 
            ringtoneRow = el('ringtoneRow');
            ringtoneModal = el('ringtoneModal');
            closeRingtoneModal = el('closeRingtoneModal');
            ringtoneDisplay = el('ringtoneDisplay');
            testRingtoneBtn = el('testRingtoneBtn');
            setRingtoneBtn = el('setRingtoneBtn');
            bookPrev = el('bookPrev');
            bookNext = el('bookNext');
            pageNumberDisplay = el('pageNumber');
            backPanel = document.querySelector('.pda-back-panel'); // Assign global backPanel
    
            newsModule = createNewsModule(state, el, showView, ringtoneModal);
    
            secretHandler = createSecretHandler(el, showView, ringtoneModal);
            renderPrograms();
    
            showView('home');
    
            setInterval(updateHome, 1000);
            updateHome();
            
            const pdaContainer = el('pda');
            const flipTriggerBtn = el('btn-flip-trigger');
            const flipBackBtn = el('btn-flip-back');       
        
            if (flipTriggerBtn && pdaContainer) {
                flipTriggerBtn.addEventListener('click', () => {
                    // Toggle logic to handle flip AND reattach panel if necessary
                    if (pdaContainer.classList.contains('flipped')) {
                        // We are flipping back to front
                        if (backPanel && backPanel.classList.contains('detached')) {
                            backPanel.classList.remove('detached');
                        }
                        pdaContainer.classList.remove('flipped');
                    } else {
                        // We are flipping to the back
                        pdaContainer.classList.add('flipped');
                    }
                });
            }
        
            if (flipBackBtn && pdaContainer) {
                flipBackBtn.addEventListener('click', () => {
                    pdaContainer.classList.remove('flipped');
                });
            }
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
    
            if (btnStylus) {
                btnStylus.addEventListener('click', () => {
                    state.stylus = !state.stylus;
                    btnStylus.setAttribute('aria-pressed', String(state.stylus));
                });
            }
    
            if (btnFull && pda) {
                btnFull.addEventListener('click', () => {
                    if (!document.fullscreenElement) {
                        pda.requestFullscreen?.();
                    } else {
                        document.exitFullscreen?.();
                    }
                });
            }
    
            const pdaScreen = document.querySelector('.PDA-screen');
    
            const turnOffScreen = () => {
                if(powerOverlay) powerOverlay.classList.remove('hidden');
                if(pdaScreen) pdaScreen.classList.add('screen-off'); 
                state.poweredOn = false;
            };
    
            const turnOnScreen = () => {
                if(powerOverlay) powerOverlay.classList.add('hidden');
                if(pdaScreen) pdaScreen.classList.remove('screen-off');
                state.poweredOn = true;
            };
    
            if(!state.poweredOn) {
                turnOffScreen();
            }
    
            if (btnEject) {
                btnEject.addEventListener('click', () => {
                    turnOffScreen();
                });
            }
    
            if (powerOn) {
                powerOn.addEventListener('click', () => {
                    turnOnScreen();
                });
            }
            const selectAllText = (event) => {
                event.target.select();
            };
    
            const ringtoneInputs = document.querySelectorAll('.ringtone-note-input');
            ringtoneInputs.forEach(input => {
                input.addEventListener('focus', selectAllText);
            });
    
            if (ringtoneRow && ringtoneModal) {
                ringtoneRow.addEventListener('click', () => {
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
                const currentRingtone = Array.from(document.querySelectorAll('.ringtone-note-input')).map(input => input.value.toUpperCase());
                state.settings.ringtone = currentRingtone;
                ringtoneModal.classList.add('hidden');
                playRingtone();
            });
    
            initializePageFlip();
    
            initializeShineEffect();
    
            initializeBookNotes();
    
            initializeDraggableItems();
    
        const panDownBtn = el('panDownBtn');
        const panDownButtons = document.querySelectorAll('.pan-down');
        const panUpBtn = el('panUpBtn');
        const secondPageContainer = el('secondPageContainer');
    
        if (panDownButtons && panDownButtons.length) {
            panDownButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (secondPageContainer) {
                        secondPageContainer.classList.remove('hidden');
                        secondPageContainer.classList.add('active');
                    }
                });
            });
        }
    
        (function() {
            const drawerButtons = document.querySelectorAll('.pan-button.top-right-drawer');
            if (!drawerButtons || drawerButtons.length === 0) return;
    
            let drawerPanel = document.querySelector('.top-right-drawer-panel');
            if (!drawerPanel) return;
    
            let activeButton = null;
    
            drawerButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (activeButton === btn && drawerPanel.classList.contains('open')) {
                        drawerPanel.classList.remove('open');
                        activeButton = null;
                        return;
                    }
    
                    activeButton = btn;
                    requestAnimationFrame(() => drawerPanel.classList.add('open'));
                });
            });
    
            document.addEventListener('click', (ev) => {
                if (!drawerPanel.classList.contains('open')) return;
                if (drawerPanel.contains(ev.target)) return;
                if (Array.from(drawerButtons).some(b => b.contains(ev.target))) return;
                drawerPanel.classList.remove('open');
                activeButton = null;
            });
    
            document.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape' && drawerPanel.classList.contains('open')) {
                    drawerPanel.classList.remove('open');
                    activeButton = null;
                }
            });
        })();
    
        if (panUpBtn) {
            panUpBtn.addEventListener('click', () => {
                if (secondPageContainer) {
                    secondPageContainer.classList.remove('active');
                }
            });
        }
        });
    
        // --- REPAIR LOGIC ---
        const RESISTOR_EFFECTS = {
            '220': ['overlay-battery', 'overlay-traces'],
            '100': ['overlay-communication', 'overlay-terminal'], 
            '10k': ['overlay-notekeeper', 'overlay-speakers'] 
        };
    
        function initializeDraggableItems() {
            const items = document.querySelectorAll('.drawer-item');
            const drawerZone = document.getElementById('drawerDropZone');
            const drawerPanel = document.querySelector('.top-right-drawer-panel');
    
            const screws = document.querySelectorAll('.screw');
            // backPanel is now global, assigned in DOMContentLoaded
            // const backPanel = document.querySelector('.pda-back-panel'); 
            const resistorSlot = document.getElementById('resistorSlot');
            const powerBtn = document.getElementById('powerOn');
            
            // --- UPDATED CLICK LOGIC FOR PANEL ---
            // Use toggle so it can be put back on if clicked while detached
            if (backPanel) {
                backPanel.addEventListener('click', () => {
                    if (backPanel.classList.contains('unlocked')) {
                        backPanel.classList.toggle('detached');
                    }
                });
            }
            
            state.poweredOn = false; 
            if(pda) pda.classList.add('powered-off');
            if(powerOverlay) powerOverlay.classList.remove('hidden');
            if(powerBtn) {
                powerBtn.disabled = true;
                powerBtn.textContent = "System Error";
                powerBtn.style.backgroundColor = "#555";
                powerBtn.style.cursor = "not-allowed";
            }
    
            const isOverlapping = (el1, el2) => {
                const rect1 = el1.getBoundingClientRect();
                const rect2 = el2.getBoundingClientRect();
                return !(
                    rect1.right < rect2.left ||
                    rect1.left > rect2.right ||
                    rect1.bottom < rect2.top ||
                    rect1.top > rect2.bottom
                );
            };
    
            const checkPanelStatus = () => {
                const remaining = document.querySelectorAll('.screw:not(.removed)').length;
                if (remaining === 0 && backPanel) {
                    backPanel.classList.add('unlocked');
                    backPanel.classList.add('detached'); 
                }
            };
    
            const repairPDA = () => {
                const slot = document.getElementById('resistorSlot');
                slot.style.boxShadow = "0 0 15px #0f0, inset 0 0 10px #0f0"; 
                
                setTimeout(() => {
                    if (backPanel) backPanel.classList.remove('detached');
                }, 600);
    
                setTimeout(() => {
                    if (pda) pda.classList.remove('flipped');
                }, 1200);
                
                document.querySelector('.overlay-battery').classList.add('active');
                document.querySelector('.overlay-traces').classList.add('active');
    
                if(powerBtn) {
                    powerBtn.disabled = false;
                    powerBtn.textContent = "Power On";
                    powerBtn.style.backgroundColor = ""; 
                    powerBtn.style.cursor = "pointer";
                    
                    setTimeout(() => {
                        if(!state.poweredOn) {
                            powerBtn.click();
                        }
                    }, 1800); 
                }
            };
    
            items.forEach(item => {
                item.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
    
                    let isUnplacing = false;
                    if (item.classList.contains('placed')) {
                        isUnplacing = true;
                        item.classList.remove('placed');
                        if (resistorSlot) resistorSlot.style.boxShadow = "";
                        document.querySelectorAll('.pcb-overlay').forEach(ov => ov.classList.remove('active'));
                        if (powerBtn) {
                            powerBtn.textContent = "System Error";
                            powerBtn.style.backgroundColor = "#555";
                        }
                        if (powerBtn && powerBtn.textContent === "Voltage Error") {
                            powerBtn.textContent = "System Error";
                            powerBtn.style.backgroundColor = "#555";
                        }
    
                        if (resistorSlot) resistorSlot.style.boxShadow = "";
                        document.querySelector('.overlay-battery').classList.remove('active');
                        document.querySelector('.overlay-traces').classList.remove('active');
                    }
                    
                    const rect = item.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left;
                    const offsetY = e.clientY - rect.top;
                    const wasFloating = item.classList.contains('floating');
    
                    if (!wasFloating) {
                        item.style.left = rect.left + 'px';
                        item.style.top = rect.top + 'px';
                        
                        if (isUnplacing) {
                            item.style.width = '40px'; 
                            item.style.height = '10px';
                        } else {
                            item.style.width = rect.width + 'px';
                            item.style.height = rect.height + 'px';
                        }
    
                        item.classList.add('floating');
                        document.body.appendChild(item);
                    }
    
                    const onMouseMove = (moveEvent) => {
                        item.style.left = (moveEvent.clientX - offsetX) + 'px';
                        item.style.top = (moveEvent.clientY - offsetY) + 'px';
                    };
    
                    const onMouseUp = (upEvent) => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
    
                        // 1. SCREWDRIVER LOGIC
                        if (item.classList.contains('screwdriver-prop')) {
                            screws.forEach(screw => {
                                if (!screw.classList.contains('removed') && isOverlapping(item, screw)) {
                                    screw.classList.add('removed');
                                    const a = new Audio('/Audio/click_fast.ogg'); 
                                    // a.play().catch(()=>{});
                                    checkPanelStatus();
                                }
                            });
                        }
    
                        // 2. RESISTOR LOGIC
                        if (item.classList.contains('resistor-prop')) {
                            if (backPanel && backPanel.classList.contains('detached') && isOverlapping(item, resistorSlot)) {
                                const ohms = item.dataset.ohms;
                                
                                item.style.position = 'absolute';
                                item.classList.remove('floating');
                                item.style.left = ''; 
                                item.style.top = '';
                                item.style.width = ''; 
                                item.style.height = '';
                                item.style.transform = ''; 
                                item.classList.add('placed');
                                resistorSlot.innerHTML = '';
                                resistorSlot.appendChild(item);
    
                                const effects = RESISTOR_EFFECTS[ohms];
                                if (effects) {
                                    effects.forEach(cls => {
                                        const overlayEl = document.querySelector('.' + cls);
                                        if (overlayEl) overlayEl.classList.add('active');
                                    });
                                }
    
                                if (ohms === '220') {
                                    repairPDA();
                                } else {
                                    if(powerBtn) {
                                        powerBtn.textContent = "Voltage Error";
                                        powerBtn.style.backgroundColor = "#a00";
                                    }
                                }
                                return; // Return early if placed in slot
                            }
                        }
    
                        // 3. RETURN TO DRAWER LOGIC (Common for all items)
                        const drawerRect = drawerPanel.getBoundingClientRect();
                        const isOverDrawer = (
                            upEvent.clientX >= drawerRect.left &&
                            upEvent.clientX <= drawerRect.right &&
                            upEvent.clientY >= drawerRect.top &&
                            upEvent.clientY <= drawerRect.bottom
                        );
    
                        if (isOverDrawer && drawerPanel.classList.contains('open')) {
                            item.classList.remove('floating');
                            
                            item.style.position = ''; 
                            
                            item.style.left = '';
                            item.style.top = '';
                            item.style.width = '';
                            item.style.height = '';
                            item.style.transform = ''; 
                            
                            if(item.classList.contains('resistor-prop')){
                                    document.querySelector('.resistor-kit').appendChild(item);
                            } else {
                                    drawerZone.appendChild(item);
                            }
                        }
                    };
    
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });
            });
        }
    })();
    