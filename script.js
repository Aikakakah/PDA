// PDA Replica script
(() => {
    // --- State (Expanded with Crew Manifest, NanoChat, Settings, and corrected Station) ---
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
            { uid: 5, name: "Settings", icon: "⚙️", type: "settings" }
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
            ringtone: ["E", "D", "C", "G", "C", "G"],
            accentColor: "#5e2b63"
        },
        // --- NEW BOOK STATE ---
        book: {
            currentPage: 1,
            maxPages: 15 // Set your total number of pages here
        }
    };

    // --- PEEL.JS BOOK LOGIC ---
function initializeBook() {
    const bookContainer = document.getElementById('book');
    const pageCount = state.book.maxPages;

    // Clear any old content
    bookContainer.innerHTML = '';

    // Generate pages dynamically from /Pages/
    for (let i = 1; i <= pageCount; i++) {
        const page = document.createElement('div');
        page.classList.add('peel-page');
        page.style.backgroundImage = `url('Pages/Page_${i}.png')`;
        page.style.backgroundSize = 'cover';
        page.style.backgroundPosition = 'center';
        page.dataset.page = i;
        bookContainer.appendChild(page);
    }

    // Initialize Peel.js
    const peel = new Peel('#book');
    peel.setMode('book');

    // Handle dragging
    peel.handleDrag(function(evt, x, y) {
        this.setPeelPosition(x, y);
    });

    // Page navigation
    let currentPage = 1;
    const pageNumberDisplay = document.getElementById('pageNumber');
    const bookPrev = document.getElementById('bookPrev');
    const bookNext = document.getElementById('bookNext');

    const updatePageDisplay = () => {
        pageNumberDisplay.textContent = `Page ${currentPage} of ${pageCount}`;
        bookPrev.disabled = currentPage <= 1;
        bookNext.disabled = currentPage >= pageCount;
    };

    bookPrev.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            peel.turnTo(currentPage);
            updatePageDisplay();
        }
    });

    bookNext.addEventListener('click', () => {
        if (currentPage < pageCount) {
            currentPage++;
            peel.turnTo(currentPage);
            updatePageDisplay();
        }
    });

    updatePageDisplay();
}


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

    // --- BOOK ELEMENTS (Reused IDs) ---
    const bookPrev = el('bookPrev');
    const bookNext = el('bookNext');
    const bookPagesContainer = el('bookPagesContainer');
    const pageNumberDisplay = el('pageNumber');
    
    // --- TURN.JS / BOOK WIDGET LOGIC ---
    
    // Function to generate the HTML content for a single page
    function pageContent(page) {
        if (page < 1 || page > state.book.maxPages) {
            return '<div class="blank-page"></div>';
        }
        // NOTE: This assumes images are named Pages/Page_1.png, Pages/Page_2.png, etc.
        return `<img src="Pages/Page_${page}.png" alt="Page ${page}" />`;
    }

    // Renders the page numbers in the top middle control bar
    function updatePageDisplay(page) {
        const total = state.book.maxPages;
        // Determine the visible spread (left and right page numbers)
        const leftPageNum = (page % 2 === 0) ? page : page - 1;
        const rightPageNum = (page % 2 === 0) ? page + 1 : page;

        let pageText = '';
        if (leftPageNum >= 1 && leftPageNum <= total) {
             pageText = `Page ${leftPageNum}`;
        }
        // Only show the right page number if it's within bounds and greater than the left
        if (rightPageNum <= total && rightPageNum > leftPageNum) {
             pageText += (pageText ? ` & ${rightPageNum}` : `Page ${rightPageNum}`);
        } else if (pageText === '') {
             pageText = 'Cover'; // Handle the front cover (Page 1 in 'single' mode, or a blank start)
        }
        
        pageNumberDisplay.textContent = pageText;
    }

    // Function to initialize Turn.js
    // function initializeBook() {
    //     // Use jQuery to initialize the book
    //     $(bookPagesContainer).turn({
    //         width: 630, // Must match --book-width from CSS
    //         height: 400, // Must match --book-height from CSS
    //         autoCenter: true,
    //         display: 'double', // Shows two pages at once
    //         acceleration: true,
    //         pages: state.book.maxPages // Total number of pages
    //     });

    //     // Event: Fired when the page is fully turned
    //     $(bookPagesContainer).bind('turned', function(event, page, view) {
    //         state.book.currentPage = page;
    //         updatePageDisplay(page);
    //         updateControlButtons(page);
    //     });
        
    //     // Event: Fired when a page is requested by the library (dynamic loading)
    //     // This is the CRUCIAL part that ensures the back of the flipped page is correct
    //     $(bookPagesContainer).bind('missing', function(event, pages) {
    //         for (var i = 0; i < pages.length; i++) {
    //             // Add the missing page element and load its content
    //             var pageElement = $('<div />', {'class': 'page-content'}).html(pageContent(pages[i]));
    //             // The 'addPage' method inserts the page HTML into the Turn.js structure
    //             $(bookPagesContainer).turn('addPage', pageElement, pages[i]);
    //         }
    //     });
        
    //     // Start by loading the first page content
    //     $(bookPagesContainer).turn('page', state.book.currentPage);
    //     updatePageDisplay(state.book.currentPage);
    //     updateControlButtons(state.book.currentPage);
    // }
    
    // Updates control buttons (Prev/Next) based on current page
    // function updateControlButtons(page) {
    //     const total = state.book.maxPages;
    //     bookPrev.disabled = (page <= 1);
    //     bookNext.disabled = (page >= total);
    // }

    // Function to handle control button clicks using the Turn.js API
    // function flipBookAPI(direction) {
    //     const $book = $(bookPagesContainer);
    //     const currentPage = $book.turn('page');
        
    //     if (direction === 1) { // Forward
    //          if (currentPage < state.book.maxPages) {
    //             $book.turn('next');
    //          }
    //     } else if (direction === -1) { // Backward
    //         if (currentPage > 1) {
    //             $book.turn('previous');
    //         }
    //     }
    // }

    // --- Event Listeners for Turn.js Controls ---
    // bookNext.addEventListener('click', () => flipBookAPI(1));
    // bookPrev.addEventListener('click', () => flipBookAPI(-1));


    // --- UTILITY FUNCTIONS ---
    function showView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }

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
                programArea.innerHTML = `<div class="cartridge-header">${p.name}</div><p>Program not found or corrupted.</p>`;
                break;
        }
    }

    // Program views
    function renderNotekeeper() {
        programArea.className = 'program-area notekeeper-view';
        programArea.innerHTML = `
            <div class="cartridge-header">Notekeeper</div>
            <div class="notes-wrap" id="notesWrap"></div>
            <div class="note-input">
                <input type="text" id="newNoteInput" placeholder="Add new note..." maxlength="40">
                <button id="addNoteBtn">ADD</button>
            </div>
        `;
        const notesWrap = el('notesWrap');
        const addNoteBtn = el('addNoteBtn');
        const newNoteInput = el('newNoteInput');

        const updateNotesList = () => {
            notesWrap.innerHTML = '';
            state.notes.forEach((note, index) => {
                const noteEl = document.createElement('div');
                noteEl.className = 'note';
                noteEl.innerHTML = `<span>${note}</span><button data-index="${index}">DEL</button>`;
                noteEl.querySelector('button').addEventListener('click', (e) => {
                    state.notes.splice(e.target.dataset.index, 1);
                    updateNotesList();
                });
                notesWrap.appendChild(noteEl);
            });
        };

        const addNote = () => {
            const text = newNoteInput.value.trim();
            if (text) {
                state.notes.push(text);
                newNoteInput.value = '';
                updateNotesList();
            }
        };

        addNoteBtn.addEventListener('click', addNote);
        newNoteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addNote();
        });
        updateNotesList();
    }

    function renderManifest() {
        programArea.className = 'program-area crew-manifest';
        programArea.innerHTML = `
            <div class="cartridge-header">Crew Manifest</div>
            <div class="manifest-list" id="manifestList"></div>
        `;
        const manifestList = el('manifestList');
        const sortedCrew = {};

        // Group crew by rank
        state.crew.forEach(c => {
            if (!sortedCrew[c.rank]) {
                sortedCrew[c.rank] = [];
            }
            sortedCrew[c.rank].push(c);
        });

        // Render sections
        for (const rank in sortedCrew) {
            const header = document.createElement('h4');
            header.textContent = `${rank} (${sortedCrew[rank].length})`;
            manifestList.appendChild(header);

            sortedCrew[rank].forEach(c => {
                const entry = document.createElement('div');
                entry.className = 'manifest-entry';
                entry.innerHTML = `<div class="name">${c.name}</div><div class="role">${c.role}</div>`;
                manifestList.appendChild(entry);
            });
        }
    }

    function renderNanoChat() {
        programArea.className = 'program-area';
        programArea.innerHTML = `
            <div class="nanochat">
                <div class="chat-header" id="chatHeader"></div>
                <div class="chat-body">
                    <div class="chat-sidebar" id="chatSidebar"></div>
                    <div class="chat-main">
                        <div class="chat-messages" id="chatMessages"></div>
                        <div class="chat-input-wrap">
                            <input type="text" id="chatInput" placeholder="Message..." />
                            <button id="chatSend"><i class="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const chatSidebar = el('chatSidebar');
        const chatMessages = el('chatMessages');
        const chatHeader = el('chatHeader');
        const chatInput = el('chatInput');
        const chatSend = el('chatSend');

        const renderSidebar = () => {
            chatSidebar.innerHTML = '';
            for (const key in state.nanochat.channels) {
                const channel = state.nanochat.channels[key];
                const contactEl = document.createElement('div');
                contactEl.className = `chat-contact${key === state.nanochat.currentContact ? ' active' : ''}`;
                contactEl.textContent = channel.name;
                contactEl.dataset.contact = key;
                contactEl.addEventListener('click', () => {
                    state.nanochat.currentContact = key;
                    renderChat();
                });
                chatSidebar.appendChild(contactEl);
            }
        };

        const renderChat = () => {
            const currentKey = state.nanochat.currentContact;
            const channel = state.nanochat.channels[currentKey];
            chatHeader.textContent = channel.name;
            chatMessages.innerHTML = '';
            
            channel.messages.forEach(m => {
                const row = document.createElement('div');
                row.className = `message-row ${m.type}`;
                row.innerHTML = `<div class="message-bubble ${m.type}">${m.text}</div>`;
                chatMessages.appendChild(row);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
            renderSidebar();
        };

        const sendMessage = () => {
            const text = chatInput.value.trim();
            if (text) {
                const channel = state.nanochat.channels[state.nanochat.currentContact];
                channel.messages.push({ sender: state.owner, text: text, type: "sent" });
                chatInput.value = '';
                renderChat();
            }
        };

        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        renderChat();
    }

    function renderStationNews() {
        programArea.className = 'program-area';
        programArea.innerHTML = `
            <div class="station-news">
                <div class="news-title">Station News Broadcast</div>
                <div class="news-content">
                    <p>ALERT: Cargo Bay 3 breach contained. All non-essential personnel are authorized to resume normal duties. Minor structural damage reported, awaiting repair crew. Stay safe, Manta Station.</p>
                </div>
                <div class="news-controls">
                    <button><i class="fas fa-search"></i></button>
                    <button><i class="fas fa-sync"></i></button>
                </div>
                <p style="font-size: 0.8em; color: var(--muted); margin-top: 15px;">Last updated: ${new Date().toLocaleTimeString()}</p>
            </div>
        `;
    }

    // --- SETTINGS LOGIC ---

    // Ringtone logic (using the PDA speaker)
    const notes = {
        'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23, 'G': 392.00, 'A': 440.00, 'B': 493.88
    };
    let audioContext = null;

    function playNote(frequency, duration) {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (!state.poweredOn) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'square'; // Classic 8-bit sound
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        // Fade in
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        
        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration - 0.01);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }

    function playRingtone() {
        if (!state.poweredOn) return;
        let delay = 0;
        state.settings.ringtone.forEach((note, index) => {
            const freq = notes[note.toUpperCase()];
            const duration = 0.2;
            setTimeout(() => playNote(freq, duration), delay * 1000);
            delay += duration;
        });
    }

    // Modal and settings logic
    function openRingtoneModal() {
        ringtoneModal.classList.remove('hidden');
        ringtoneDisplay.innerHTML = state.settings.ringtone.map(n => `<span>${n}</span>`).join('');
    }

    // --- GENERAL EVENT LISTENERS ---

    // Navigation Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const viewName = e.currentTarget.dataset.tab;
            showView(viewName);
            tabs.forEach(t => t.setAttribute('aria-pressed', 'false'));
            e.currentTarget.setAttribute('aria-pressed', 'true');
            // Close any open program view
            programTitleMini.classList.add('hidden'); 
        });
    });

    // Light Toggle
    btnLight.addEventListener('click', () => {
        state.flashlight = !state.flashlight;
        btnLight.setAttribute('aria-pressed', state.flashlight);
        lightIndicator.classList.toggle('hidden', !state.flashlight);
    });

    // Stylus Toggle (just visual)
    btnStylus.addEventListener('click', () => {
        state.stylus = !state.stylus;
        btnStylus.setAttribute('aria-pressed', state.stylus);
        pda.classList.toggle('stylus-on', state.stylus); // stylus-on logic remains in the script as it ties to state and DOM
    });

    // Fullscreen
    btnFull.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            pda.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    });

    // Program Close Button (Back to Programs)
    progClose.addEventListener('click', () => {
        showView('programs');
        document.querySelectorAll('.nav-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
        el('tab-programs').setAttribute('aria-pressed', 'true');
        programTitleMini.classList.add('hidden');
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
        state.settings.accentColor = c;
    });
    
    // Ringtone Modal Events
    ringtoneRow.addEventListener('click', openRingtoneModal);
    closeRingtoneModal.addEventListener('click', () => ringtoneModal.classList.add('hidden'));
    testRingtoneBtn.addEventListener('click', playRingtone);
    setRingtoneBtn.addEventListener('click', () => {
        // In a real application, you'd allow the user to input notes here. 
        // For now, setting the ringtone just tests the existing one.
        playRingtone();
        ringtoneModal.classList.add('hidden');
    });
    
    // --- DRAG LOGIC (Simplified) ---
    const header = el('header');
    let isDragging = false;
    let offsetX, offsetY;
    
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        pda.style.position = 'absolute'; // Ensure it's absolute for dragging
        const rect = pda.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        pda.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        pda.style.left = `${e.clientX - offsetX}px`;
        pda.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        pda.style.cursor = 'grab';
    });


    // --- INITIAL RENDER ---
    renderPrograms();
    setInterval(updateHome, 1000);
    updateHome();
    
    // INITIALIZE THE TURN.JS BOOK
    // Use jQuery's ready function to ensure the DOM and jQuery are loaded
    // $(document).ready(initializeBook);
    document.addEventListener('DOMContentLoaded', initializeBook);


    // --- INITIALIZE PEEL.JS ---
document.addEventListener('DOMContentLoaded', () => {
  const p = new Peel('#book');
  p.setMode('book');
  p.handleDrag(function(evt, x, y) {
    this.setPeelPosition(x, y);
  });
});


    // Re-apply current accent color (if changed in another session or pre-set)
    document.documentElement.style.setProperty('--accent', state.settings.accentColor);
    el('accentH').style.background = state.settings.accentColor;
    el('accentV').style.background = state.settings.accentColor;
    accentPicker.value = state.settings.accentColor;
})();