// PDA Replica script
(() => {
    // --- State (Expanded with Crew Manifest, NanoChat, Settings, and corrected Station) ---
    const state = {
        owner: "Ramona Orthall",
        id: "Ramona Orthall",
        job: "Scientist",
        station: "NTTD Manta Station PR-960", // Corrected per Crew Manifest image
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
            { uid: 5, name: "Settings", icon: "⚙️", type: "settings" } // Added Settings program
        ],
        notes: ["Check filter", "Bring gloves"],
        // Crew Manifest Data (simulated)
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
        // NanoChat Data (simulated)
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
        // Settings Data
        settings: {
            ringtone: ["E", "D", "C", "G", "C", "G"],
            accentColor: "#5e2b63"
        },
        // --- NEW BOOK STATE ---
        book: {
            currentPage: 1,
            // You will need to adjust this max based on the number of images in your "Pages" folder
            maxPages: 15 
        }
    };

    // Advance date by ~630 years
    state.currentDate.setFullYear(state.currentDate.getFullYear() + 630);

    // --- DOM Elements ---
    const el = id => document.getElementById(id);
    const pda = el('pda');
    const views = { home: el('view-home'), programs: el('view-programs'), settings: el('view-settings'), program: el('view-program') };
    const tabs = document.querySelectorAll('.nav-btn');
    const programGrid = el('programGrid');
    const btnLight = el('btn-light');
    const btnStylus = el('btn-stylus');
    const btnFull = el('btn-full');
    const btnEject = el('btn-eject');
    const accentPicker = el('accentPicker');
    const powerOverlay = el('powerOverlay');
    const powerOn = el('powerOn');
    const progClose = el('progClose');
    const programArea = el('programArea');
    const programTitleMini = el('programTitleMini');
    const lightIndicator = el('lightIndicator');
    const ringtoneRow = el('ringtoneRow');
    const ringtoneModal = el('ringtoneModal');
    const closeRingtoneModal = el('closeRingtoneModal');
    const ringtoneDisplay = el('ringtoneDisplay');
    const testRingtoneBtn = el('testRingtoneBtn');
    const setRingtoneBtn = el('setRingtoneBtn');

    // --- NEW BOOK ELEMENTS ---
    const bookPrev = el('bookPrev');
    const bookNext = el('bookNext');
    const bookPagesContainer = el('bookPagesContainer');
    const pageNumberDisplay = el('pageNumber');


    // Quick helpers
    function showView(v) {
        Object.values(views).forEach(x => x.classList.remove('active'));
        views[v].classList.add('active');
        // Hide program header if not in a program view
        el('progHeader').style.display = (v === 'program' ? 'flex' : 'none');
    }

    // --- BOOK WIDGET LOGIC ---
    function updateBook() {
        const leftPage = state.book.currentPage;
        const rightPage = leftPage + 1;
        const max = state.book.maxPages;

        let content = '';
        let pageText = '';

        if (leftPage >= 1 && leftPage <= max) {
        // Always display the left page
          content += `<img src="Pages/Page_${leftPage}.png" alt="Page ${leftPage}" />`;
          pageText += `Pages ${leftPage}`;

          if (rightPage <= max) {
                // Display the right page if it's within the max limit
                content += `<img src="Pages/Page_${rightPage}.png" alt="Page ${rightPage}" />`;
                pageText += ` & ${rightPage}`;
            } else {
                // Placeholder for the last right-hand page if the total is odd
                content += `<div class="single-page-spacer"></div>`;
            }
        }
        // 1. Update Image
        //bookPageContainer.innerHTML = `<img src="Pages/Page_${page}.png" alt="Page ${page}" />`;
        bookPagesContainer.innerHTML = content;

        // 2. Update Page Number
        //pageNumberDisplay.textContent = `Page ${page}`;
        pageNumberDisplay.textContent = pageText;

        // 3. Update Controls (Disable buttons at limits)
        // bookPrev.disabled = (page <= 1);
        // bookNext.disabled = (page >= max);
        bookPrev.disabled = (leftPage <= 1);
        bookNext.disabled = (leftPage + 2 > max);
    }

    function flipPage(direction) {
        let newPage = state.book.currentPage + (direction * 2); 
        const max = state.book.maxPages;

        // Calculate the maximum valid starting page for a flip
        // Max valid starting page is max - 1 if max is even, or max if max is odd (to show the last page)
        const maxValidStartPage = max % 2 === 0 ? max - 1 : max;
        
        if (newPage >= 1 && newPage <= maxValidStartPage) {
             
             // Add a temporary fade out/in effect
             const imgs = bookPagesContainer.querySelectorAll('img');
             if (imgs) imgs.forEach(img => img.style.opacity = 0);

             setTimeout(() => {
                state.book.currentPage = newPage;
                updateBook();
                const newImgs = bookPagesContainer.querySelectorAll('img');
                if (newImgs) newImgs.forEach(img => img.style.opacity = 1);
             }, 300);
        }
        // This ensures that if you are at max-1 (an even number of pages) or max (an odd number of pages) and click next, it stays.
        else if (direction === 1 && state.book.currentPage < maxValidStartPage) {
             // Specifically handle the flip to the last odd page if needed
             state.book.currentPage = maxValidStartPage;
             updateBook();
          }
     }

    // Add event listeners for the book
    bookNext.addEventListener('click', () => flipPage(1));
    bookPrev.addEventListener('click', () => flipPage(-1));
    
    // Clicking the page itself flips forward
    bookPagesContainer.addEventListener('click', () => flipPage(1));


    // --- HOME VIEW LOGIC ---
    function updateHome() {
        el('owner').textContent = state.owner;
        el('idline').innerHTML = `${state.id}, <span id="job" class="job">${state.job}</span>`;
        el('station').textContent = state.station;
        el('instructions').textContent = state.instructions;
        el('date').textContent = state.currentDate.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });

        // Update alert level
        el('alert').textContent = state.alert;
        el('alert').className = 'alert ' + state.alert.toLowerCase();

        // shift duration
        const elapsed = Date.now() - state.shiftStart;
        const hh = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
        const mm = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
        const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
        el('shift').textContent = `${hh}:${mm}:${ss}`;
    }

    // --- PROGRAM LOGIC ---

    // Render program tiles
    function renderPrograms() {
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

    // Open a program view (cartridge)
    function openProgram(p) {
        programTitleMini.textContent = p.name;
        programTitleMini.classList.remove('hidden');
        showView('program');
        programArea.innerHTML = ''; // Clear program UI

        switch (p.type) {
            case 'notekeeper':
                renderNotekeeper();
                break;
            case 'manifest':
                renderManifest();
                break;
            case 'nanochat':
                renderNanoChat();
                break;
            case 'news':
                renderStationNews();
                break;
            case 'settings':
                // Settings is in its own main tab, but if clicked from here, show the main tab
                showView('settings');
                document.querySelectorAll('.nav-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
                el('tab-settings').setAttribute('aria-pressed', 'true');
                programTitleMini.classList.add('hidden');
                break;
            default:
                programArea.innerHTML = `<div class="cartridge-header">${p.name}</div><div class="muted">This cartridge is simulated.</div>`;
        }
    }

    // Notekeeper UI (Updated to match previous response)
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

        noteInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addBtn.click();
        });

        refreshNotes();
    }

    // Crew Manifest UI
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

    // NanoChat UI
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
            sidebar.innerHTML = '';
            for (const contactId in state.nanochat.channels) {
                const channel = state.nanochat.channels[contactId];
                const contactDiv = document.createElement('div');
                contactDiv.classList.add('chat-contact');
                contactDiv.textContent = channel.name;
                contactDiv.dataset.contactId = contactId;
                if (contactId === state.nanochat.currentContact) {
                    contactDiv.classList.add('active');
                    input.placeholder = `Message ${channel.name}...`;
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
            messagesContainer.innerHTML = '';
            const messages = state.nanochat.channels[state.nanochat.currentContact].messages;

            messages.forEach(msg => {
                const row = document.createElement('div');
                row.className = 'message-row ' + msg.type;
                row.innerHTML = `<div class="message-bubble ${msg.type}">${msg.text}</div>`;
                messagesContainer.appendChild(row);
            });

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function sendMessage() {
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

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

        renderSidebar();
        renderMessages();
    }

    // Station News UI
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

    // --- SETTINGS/UTILITY LOGIC ---

    // Play ringtone (simple beep for now)
    function playRingtone() {
        const notes = state.settings.ringtone;
        // Simple tone generation (requires browser support for AudioContext)
        if (!window.AudioContext && !window.webkitAudioContext) return;

        const noteDurations = { "E": 200, "D": 200, "C": 200, "G": 200 }; // Milliseconds
        const noteFrequencies = { "E": 329.63, "D": 293.66, "C": 261.63, "G": 392.00 }; // Hz

        let delay = 0;
        notes.forEach(noteName => {
            const frequency = noteFrequencies[noteName];
            const duration = noteDurations[noteName];

            if (frequency && duration) {
                setTimeout(() => {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
                    oscillator.connect(audioCtx.destination);
                    oscillator.start();
                    setTimeout(() => {
                        oscillator.stop();
                        // Close context if no further sounds are expected to save resources
                        setTimeout(() => audioCtx.close(), 10);
                    }, duration);
                }, delay);
                delay += duration + 50; // Add a small pause
            }
        });
    }

    // Modal Events
    ringtoneRow.addEventListener('click', () => {
        // Render current notes in modal
        ringtoneDisplay.innerHTML = state.settings.ringtone.map(note => `<span>${note}</span>`).join('');
        ringtoneModal.classList.remove('hidden');
    });

    closeRingtoneModal.addEventListener('click', () => ringtoneModal.classList.add('hidden'));
    testRingtoneBtn.addEventListener('click', playRingtone);
    setRingtoneBtn.addEventListener('click', () => {
        // In a real app, this would save the selection. Here, it just closes.
        alert('Ringtone set to: ' + state.settings.ringtone.join(' - '));
        ringtoneModal.classList.add('hidden');
    });

    // --- EVENT LISTENERS / INITIALIZATION ---

    // Tab clicks
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.nav-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
            btn.setAttribute('aria-pressed', 'true');
            programTitleMini.classList.add('hidden');
            showView(tab);
        });
    });

    // Program close
    progClose.addEventListener('click', () => {
        programTitleMini.classList.add('hidden');
        showView('programs');
        // Reset tab pressed state to 'Programs'
        document.querySelectorAll('.nav-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
        el('tab-programs').setAttribute('aria-pressed', 'true');
    });

    // Light toggle
    btnLight.addEventListener('click', () => {
        state.flashlight = !state.flashlight;
        btnLight.setAttribute('aria-pressed', String(state.flashlight));
        lightIndicator.classList.toggle('hidden', !state.flashlight);
    });

    // Stylus toggle
    btnStylus.addEventListener('click', () => {
        state.stylus = !state.stylus;
        btnStylus.setAttribute('aria-pressed', String(state.stylus));
        // Stylus highlight logic remains in the script as it ties to state and DOM
    });

    // Fullscreen
    btnFull.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            pda.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    });

    // Power / Eject
    btnEject.addEventListener('click', () => {
        powerOverlay.classList.remove('hidden');
        pda.classList.add('powered-off');
        state.poweredOn = false;
    });
    powerOn.addEventListener('click', () => {
        powerOverlay.classList.add('hidden');
        pda.classList.remove('powered-off');
        state.poweredOn = true;
    });

    // Accent color picker
    accentPicker.addEventListener('input', (e) => {
        const c = e.target.value;
        document.documentElement.style.setProperty('--accent', c);
        el('accentH').style.background = c;
        el('accentV').style.background = c;
    });

    // --- INITIAL RENDER ---
    renderPrograms();
    setInterval(updateHome, 1000);
    updateHome();
    updateBook(); // Initialize the book widget

    // Re-apply current accent color (if changed in another session or pre-set)
    document.documentElement.style.setProperty('--accent', state.settings.accentColor);
    el('accentH').style.background = state.settings.accentColor;
    el('accentV').style.background = state.settings.accentColor;
    accentPicker.value = state.settings.accentColor;
})();