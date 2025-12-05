import { createNewsModule } from './news.js';
import { createSecretHandler } from './secret_handler.js';
import { validateResistorDrop } from './Circuit/circuit.js';
import { initializeBookSystem } from './Book/book.js'; 
import { createNanoChatTriggers } from './nanochat_triggers.js';
import { createTerminalBridge } from './terminal_bridge.js';

// Helper to inject HTML from file
async function loadBookMarkup(containerId, filePath) {
    try {
        const response = await fetch(filePath);
        const html = await response.text();
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
            return true;
        }
    } catch (e) {
        console.error("Could not load book markup:", e);
    }
    return false;
}

async function loadCircuitMarkup(containerId, filePath) {
    try {
        const response = await fetch(filePath);
        const html = await response.text();
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = html;
            return true;
        }
    } catch (e) {
        console.error("Could not load circuit markup:", e);
    }
    return false;
}

function formatSolTimestamp() {
    const now = new Date();
    
    // Using UTC time to ensure consistency
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `SOL-${month}${day}.${hours}${seconds}`;
}

(async () => {
    const savedIdentity = localStorage.getItem('pda_user_identity');
    const defaultOwner = "Ramona Orthall";

    const state = {
        owner: defaultOwner,
        id: savedIdentity || "Unknown", // VARIABLE: Changes based on user input
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
            terminal: false,
            ringtone: false,
            power: false 
        },
        // Puzzle Tracking
        puzzles: new Set(),
        // Define total breakdown for percentage calculation
        totalPuzzles: 7, // 5 Hardware fixes + 1 Ringtone Secret + 1 Chat Secret

        adminOverride: false,
        programs: [
            { uid: 1, name: "Crew manifest", icon: "CM", type: "manifest" },
            { uid: 2, name: "Notekeeper", icon: "NK", type: "notekeeper" },
            { uid: 3, name: "Station news", icon: "News", type: "news" },
            { uid: 4, name: "NanoChat", icon: "NC", type: "nanochat" },
            { uid: 5, name: "Settings", icon: "⛭", type: "settings" },
            { uid: 6, name: "Terminal", icon: ">_", type: "terminal" }
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
        terminalHistory: [
            { text: "Robust#OS Kernel v4.2.0 initialized...", type: "system" },
        ],
        terminalMode: 'SHELL',
        pendingConnection: null,
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
    let nanochatModal = null;
    let closeNanochatModal = null;
    let backPanel = null;

    let newsModule = null;
    let secretHandler = null;
    let nanoChatTriggers = null; 

    // --- Discord Bridge Initialization ---
    const discordBridge = createTerminalBridge('http://localhost:3000', (msg) => {
        // 1. If already chatting, pass the message through normally
        if (state.terminalMode === 'CHAT') {
            const logEntry = { 
                source: "EXTERNAL", 
                author: msg.author, 
                timestamp: msg.solTimestamp,
                content: msg.content,
                type: "system"
            };
            
            state.terminalHistory.push(logEntry);
    
            // Immediate DOM update if the view is active
            const outputDiv = document.getElementById('termOutput');
            if (outputDiv) {
                 const history = state.terminalHistory;
                 const prevMsg = history[history.length - 2];
                 
                 // Check for grouping
                 if (!prevMsg || prevMsg.source !== "EXTERNAL" || prevMsg.author !== msg.author) {
                     const header = document.createElement('div');
                     header.className = 'terminal-header system';
                     header.textContent = `TRANSMITTING FROM: [NU-J5PR]`;
                     outputDiv.appendChild(header);
                 }
    
                 const line = document.createElement('div');
                 line.className = `terminal-line system`;
                 line.textContent = `${msg.solTimestamp}: ${msg.content}`;
                 outputDiv.appendChild(line);
                 
                 outputDiv.scrollTop = outputDiv.scrollHeight;
            }
            return;
        }
    
        // 2. If NOT chatting, intercept as a connection request
        // Prevent spamming the prompt if one is already pending
        if (state.pendingConnection) return;
    
        state.pendingConnection = msg; // Store the message for later
    
        const alertText = "Receiving Secure Connection Request... Accept? [Y/N]";
        state.terminalHistory.push({
            text: alertText,
            type: "system" // Uses blue system color
        });
    
        // Immediate DOM update for the prompt
        const outputDiv = document.getElementById('termOutput');
        if (outputDiv) {
             const line = document.createElement('div');
             line.className = 'terminal-line system';
             line.style.fontWeight = 'bold'; // Make it pop
             line.textContent = alertText;
             outputDiv.appendChild(line);
             outputDiv.scrollTop = outputDiv.scrollHeight;
        }
    });

    // Start listening immediately
    discordBridge.start();


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

    function updateHome() {
        if (el('owner')) el('owner').textContent = state.owner; // Always Ramona
        if (el('idline')) el('idline').innerHTML = `${state.id}, <span id="job" class="job">${state.job}</span>`; // Shows user input ID
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
    // --- NEW: System Status Logic ---
    function markPuzzleComplete(id) {
        if (!state.puzzles.has(id)) {
            state.puzzles.add(id);
            console.log(`Puzzle Progress: ${id} unlocked.`);
            // Optional: Play a small sound or show a notification
        }
    }

    function markPuzzleComplete(id) {
        if (!state.puzzles.has(id)) {
            state.puzzles.add(id);
            console.log(`[System] Puzzle Unlocked: ${id}`);
            // Optional: Save to localStorage if you want progress to persist
            localStorage.setItem('pda_puzzles', JSON.stringify([...state.puzzles]));
        }
    }

    function renderSystemStatus() {
        const progressBar = el('statusProgressBar');
        const percentageText = el('statusPercentageText');
        const statusHardware = el('statusHardware');
        const statusSoftware = el('statusSoftware');
        const statusSecrets = el('statusSecrets');

        // 1. Define Puzzle Groups
        const hardwareIds = ['fix_power', 'fix_nanochat', 'fix_notekeeper', 'fix_news', 'fix_terminal'];
        const secretIds = ['secret_ringtone', 'secret_chat'];

        // 2. Calculate Counts
        const hardwareDone = hardwareIds.filter(id => state.puzzles.has(id)).length;
        const secretsDone = secretIds.filter(id => state.puzzles.has(id)).length;
        const totalDone = state.puzzles.size;

        // 3. Calculate Percentage
        const percent = Math.min(100, Math.round((totalDone / state.totalPuzzles) * 100));

        // 4. Update UI
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (percentageText) percentageText.textContent = `${percent}%`;

        if (statusHardware) {
            statusHardware.textContent = `${hardwareDone}/5 ONLINE`;
            statusHardware.style.color = hardwareDone === 5 ? "var(--ok)" : "var(--danger)";
        }
        
        if (statusSoftware) {
            statusSoftware.textContent = percent === 100 ? "OPTIMIZED" : "DEGRADED";
            statusSoftware.style.color = percent === 100 ? "var(--ok)" : "var(--danger)";
        }
        
        if (statusSecrets) {
            statusSecrets.textContent = `${secretsDone} FOUND`;
            statusSecrets.style.color = secretsDone > 0 ? "var(--accent)" : "var(--muted)";
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
        
        // Determine if this specific program type is locked
        let isLocked = false;
        
        if (['nanochat', 'notekeeper', 'news', 'terminal'].includes(p.type)) {
            if (!state.unlockedFeatures[p.type]) {
                isLocked = true;
            }
        }

        if (isLocked) {
            tile.classList.add('disabled');
        }

        tile.innerHTML = `<div class="glyph">${p.icon}</div><div class="label">${p.name}</div>`;
        
        if (!isLocked) {
            tile.addEventListener('click', () => openProgram(p));
        }
        
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
        case 'terminal': renderTerminal(); break; 
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
            const contactId = name.toLowerCase().replace(/\s+/g, '');
            
            state.nanochat.channels[contactId] = {
                name: name,
                messages: []
            };
            
            state.nanochat.currentContact = contactId;
            renderSidebar();
            renderMessages();
            
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
                    sender: state.id, // CHANGED from state.owner
                    text: text,
                    type: "sent"
                });
                input.value = '';
                renderMessages();
                
                const currentContactName = state.nanochat.channels[state.nanochat.currentContact].name;
                if (nanoChatTriggers) {
                    nanoChatTriggers.checkAndTrigger(currentContactName, text);
                    markPuzzleComplete('secret_chat');
                }
            }
        }

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

        renderSidebar();
        renderMessages();
    }
    
    // --- UPDATED TERMINAL RENDERER ---
    // --- UPDATED TERMINAL RENDERER ---
function renderTerminal() {
    const programArea = document.getElementById('programArea');
    const serialNum = document.getElementById('serial') ? document.getElementById('serial').textContent : "AE-239A";
    
    // 1. Determine Prompt based on Mode
    const promptText = state.terminalMode === 'CHAT' ? '[NETLINK] user:' : 'user@pda:~#';
    
    // 2. Build the HTML Structure
    programArea.innerHTML = `
        <div class="terminal-console">
            <div class="terminal-output" id="termOutput"></div>
            <div class="terminal-input-area">
                <span class="terminal-prompt" id="termPrompt">${promptText}</span>
                <input type="text" class="terminal-input" id="termInput" autocomplete="off" spellcheck="false" autofocus>
            </div>
        </div>
    `;

    const outputDiv = document.getElementById('termOutput');
    const inputField = document.getElementById('termInput');
    const promptSpan = document.getElementById('termPrompt');

    // 3. Render History Buffer
    function renderHistory() {
        outputDiv.innerHTML = '';
        
        let lastSource = null;
        let lastAuthor = null;

        state.terminalHistory.forEach(line => {
            if (line.source) {
                if (line.source !== lastSource || line.author !== lastAuthor) {
                    const header = document.createElement('div');
                    header.className = `terminal-header ${line.type || ''}`;
                    header.textContent = `TRANSMITTING FROM: [${line.author}]`;
                    outputDiv.appendChild(header);
                    
                    lastSource = line.source;
                    lastAuthor = line.author;
                }
                
                const div = document.createElement('div');
                div.className = `terminal-line ${line.type || ''}`;
                div.textContent = `${line.timestamp}: ${line.content}`;
                outputDiv.appendChild(div);

            } else {
                lastSource = null; 
                lastAuthor = null;
                const div = document.createElement('div');
                div.className = `terminal-line ${line.type || ''}`;
                div.textContent = line.text;
                outputDiv.appendChild(div);
            }
        });
        outputDiv.scrollTop = outputDiv.scrollHeight;
    }

    // 4. Command Processor
    function executeCommand(cmdRaw) {
        const cmd = cmdRaw.trim();
        if (!cmd) return;

        // --- NEW: Handle Pending Connection Request ---
        if (state.pendingConnection) {
            if (cmd.toUpperCase() === 'Y') {
                // Accept Logic
                state.terminalMode = 'CHAT';
                state.terminalHistory.push({ text: "Connection Accepted. Secure Uplink Established.", type: "system" });
                
                // Replay the pending message that triggered the request
                const msg = state.pendingConnection;
                state.terminalHistory.push({
                    source: "EXTERNAL",
                    author: msg.author,
                    timestamp: msg.solTimestamp,
                    content: msg.content,
                    type: "system"
                });
                
                state.pendingConnection = null;
                promptSpan.textContent = '[NETLINK] user:';
                
            } else if (cmd.toUpperCase() === 'N') {
                // Deny Logic
                state.terminalHistory.push({ text: "Connection Refused.", type: "error" });
                state.pendingConnection = null;
                
            } else {
                // Invalid Input during prompt
                state.terminalHistory.push({ text: "Invalid input. Accept? [Y/N]", type: "system" });
            }
            renderHistory();
            return;
        }

        // --- Existing Chat Mode Logic ---
        if (state.terminalMode === 'CHAT') {
            if (cmd.toLowerCase() === 'exit') {
                state.terminalMode = 'SHELL';
                state.terminalHistory.push({ text: "Terminating secure uplink...", type: "system" });
                promptSpan.textContent = 'user@pda:~#';
            } else {
                discordBridge.send(cmd, state.id);
                state.terminalHistory.push({
                    source: "LOCAL",
                    author: serialNum,
                    timestamp: formatSolTimestamp(),
                    content: cmd,
                    type: "muted" 
                });
            }
            renderHistory();
            return;
        }

        // --- Existing Shell Mode Logic ---
        state.terminalHistory.push({ text: `${state.id}:~# ${cmd}`, type: "muted" });

        const parts = cmd.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
            case 'help':
                state.terminalHistory.push({ text: "Available commands: help, clear, whoami, date, ls, status, chat, transmit <msg>", type: "system" });
                break;
            
            case 'clear':
                state.terminalHistory = []; 
                break;
            
            case 'whoami':
                state.terminalHistory.push({ text: `User: ${state.id}`, type: "standard" });
                state.terminalHistory.push({ text: `Role: ${state.job}`, type: "standard" });
                break;

            case 'ls':
                state.terminalHistory.push({ text: "config.sys   manifest.db   netlink.exe", type: "standard" });
                break;

            case 'status':
                state.terminalHistory.push({ text: `System Power: ${state.poweredOn ? 'ONLINE' : 'OFFLINE'}`, type: "system" });
                break;

            case 'chat':
                // Manually trigger chat mode (Outgoing request)
                state.terminalMode = 'CHAT';
                state.terminalHistory.push({ text: "Initializing Secure Connection...", type: "system" });
                setTimeout(() => {
                    state.terminalHistory.push({ text: "Connected. Type 'exit' to disconnect.", type: "system" });
                    promptSpan.textContent = '[NETLINK] user:';
                    renderHistory();
                }, 1000);
                break;

            case 'transmit':
                if (args.length > 0) {
                    const msg = args.join(' ');
                    discordBridge.send(msg, state.id);
                    state.terminalHistory.push({
                        source: "LOCAL",
                        author: serialNum,
                        timestamp: formatSolTimestamp(),
                        content: msg,
                        type: "standard"
                    });
                } else {
                    state.terminalHistory.push({ text: "Usage: transmit <message>", type: "error" });
                }
                break;

            case 'reboot':
                state.terminalHistory.push({ text: "Rebooting system...", type: "error" });
                renderHistory();
                setTimeout(() => location.reload(), 1000);
                return;

            default:
                state.terminalHistory.push({ text: `Command not found: ${command}`, type: "error" });
        }

        renderHistory();
    }

    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            executeCommand(inputField.value);
            inputField.value = '';
        }
    });

    renderHistory();
    document.querySelector('.terminal-console').addEventListener('click', () => {
        inputField.focus();
    });
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
            markPuzzleComplete('secret_ringtone');
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

    function checkCircuitState() {
        // If Admin Override is on, ignore the resistors and keep everything unlocked
        if (state.adminOverride) {
            Object.keys(state.unlockedFeatures).forEach(k => state.unlockedFeatures[k] = true);
            renderPrograms();
            return;
        }

        // Helper to check if a slot has the correct ohm value
        const isRepaired = (slotId, correctOhms) => {
            const slot = document.getElementById(slotId);
            if (slot && slot.children.length > 0) {
                return slot.children[0].dataset.ohms === correctOhms;
            }
            return false;
        };

        // Track Power
    if (state.poweredOn) markPuzzleComplete('fix_power');

    // Track Resistors
    if (isRepaired('slot-r2', '100')) {
        state.unlockedFeatures.nanochat = true;
        markPuzzleComplete('fix_nanochat');
    } else { state.unlockedFeatures.nanochat = false; }

    if (isRepaired('slot-r3', '10k')) {
        state.unlockedFeatures.notekeeper = true;
        markPuzzleComplete('fix_notekeeper');
    } else { state.unlockedFeatures.notekeeper = false; }

    if (isRepaired('slot-r6', '10')) {
        state.unlockedFeatures.news = true;
        markPuzzleComplete('fix_news');
    } else { state.unlockedFeatures.news = false; }

    const r4Ok = isRepaired('slot-r4', '220');
    const r5Ok = isRepaired('slot-r5', '10k');
    if (r4Ok && r5Ok) {
        state.unlockedFeatures.terminal = true;
        markPuzzleComplete('fix_terminal');
    } else { state.unlockedFeatures.terminal = false; }

    renderPrograms();
}

    document.addEventListener('DOMContentLoaded', async () => {
        await loadBookMarkup('book-injection-point', './Book/book.html');
        await loadCircuitMarkup('circuit-injection-point', './Circuit/circuit.html');
        
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
        backPanel = document.querySelector('.pda-back-panel'); 

        newsModule = createNewsModule(state, el, showView, ringtoneModal);

        secretHandler = createSecretHandler(el, showView, ringtoneModal);
        
        nanoChatTriggers = createNanoChatTriggers();
        
        renderPrograms();

        showView('home');

        setInterval(updateHome, 1000);
        updateHome();
        
        const pdaContainer = el('pda');
        const flipTriggerBtn = el('btn-flip-trigger');
        const flipBackBtn = el('btn-flip-back');       
        // ... existing code ...
   
        // --- System Status UI Wiring ---
    const systemStatusRow = el('systemStatusRow');
    const settingsList = el('settingsList');
    const systemStatusView = el('systemStatusView');
    const backToSettingsBtn = el('backToSettingsBtn');

    if (systemStatusRow) {
        systemStatusRow.addEventListener('click', () => {
            renderSystemStatus(); // Recalculate before showing
            if(settingsList) settingsList.classList.add('hidden');
            if(systemStatusView) systemStatusView.classList.remove('hidden');
        });
    }

    if (backToSettingsBtn) {
        backToSettingsBtn.addEventListener('click', () => {
            if(systemStatusView) systemStatusView.classList.add('hidden');
            if(settingsList) settingsList.classList.remove('hidden');
        });
    }

    // Ensure tab switching resets the view
    if (tabs && tabs.length) {
        tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                // If user leaves Settings tab and comes back, reset to main list
                if (btn.dataset.tab === 'settings') {
                    if(settingsList) settingsList.classList.remove('hidden');
                    if(systemStatusView) systemStatusView.classList.add('hidden');
                }
            });
        });
    }

        // --- NEW IDENTITY LOGIC START ---
        const identityModal = el('identityModal');
        const identityInput = el('identityInput');
        const identitySubmitBtn = el('identitySubmitBtn');
        const btnAdminId = el('btn-admin-id'); // Admin button

        const updateIdentity = (name) => {
            if (!name) return;
            // state.owner = name; // REMOVED: Owner is always Ramona
            state.id = name;
            
            localStorage.setItem('pda_user_identity', name);
            
            updateHome(); 
            
            // Ensure we are referencing the element correctly
            if (identityModal) {
                identityModal.classList.add('hidden');
                identityModal.style.display = 'none'; // Force hide via inline style as a backup
            }
        
            state.terminalHistory.push({ 
                text: `Identity verified. Welcome, ${name}.`,
                type: "system" 
            });
        };

        // 1. Check for saved identity on load
        const savedIdentity = localStorage.getItem('pda_user_identity');
        
        if (savedIdentity) {
            updateIdentity(savedIdentity);
        } else {
            // No ID found, show modal
            if (identityModal) {
                identityModal.classList.remove('hidden');
                if(identityInput) identityInput.focus();
            }
        }

        // 2. Submit Button Logic
        if (identitySubmitBtn && identityInput) {
            identitySubmitBtn.addEventListener('click', () => {
                const val = identityInput.value.trim();
                if (val.length > 0) {
                    updateIdentity(val);
                }
            });

            // Allow pressing "Enter" to submit
            identityInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') identitySubmitBtn.click();
            });
        }

        // 3. Admin Reset Button Logic
        if (btnAdminId) {
            btnAdminId.addEventListener('click', () => {
                if (identityModal) {
                    // CRITICAL FIX: Remove the class AND clear the inline style
                    identityModal.classList.remove('hidden');
                    identityModal.style.display = ''; // <--- Clears the 'display: none' set by updateIdentity
                    
                    if(identityInput) {
                        identityInput.value = state.id; // Changed to pre-fill ID not Owner
                        identityInput.focus();
                    }
                }
            });
        }
        // --- NEW IDENTITY LOGIC END ---

        // ... continue with existing code (views = { ... }) ...

        if (flipTriggerBtn && pdaContainer) {
            flipTriggerBtn.addEventListener('click', () => {
                if (pdaContainer.classList.contains('flipped')) {
                    if (backPanel && backPanel.classList.contains('detached')) {
                        backPanel.classList.remove('detached');
                    }
                    pdaContainer.classList.remove('flipped');
                } else {
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
        const btnAdminPower = el('btn-admin-power');
        const btnAdminUnlockAll = el('btn-admin-unlock-all');

    if (btnAdminPower) {
        btnAdminPower.addEventListener('click', () => {
            console.log("ADMIN: Forcing Power On");

            if (powerOn) {
                powerOn.disabled = false;
                powerOn.textContent = "Power On";
                powerOn.style.backgroundColor = ""; 
                powerOn.style.cursor = "pointer";
            }

            if(powerOverlay) powerOverlay.classList.add('hidden');
            const pdaScreen = document.querySelector('.PDA-screen');
            if(pdaScreen) pdaScreen.classList.remove('screen-off');
            state.poweredOn = true;

            btnAdminPower.style.boxShadow = "0 0 10px #fff";
        });
    }
    
    // 2. SETUP ADMIN UNLOCK LISTENER INDEPENDENTLY
    const adminUnlockBtn = el('btn-admin-unlock-all'); // Use a new const for clarity
    if (adminUnlockBtn) {
        adminUnlockBtn.addEventListener('click', () => {
            console.log("ADMIN: Toggling Unlock All");
            state.adminOverride = !state.adminOverride; // Toggle functionality

            // Visual feedback for the button
            if (state.adminOverride) {
                adminUnlockBtn.style.color = "#0f0";
                adminUnlockBtn.style.borderColor = "#0f0";
                adminUnlockBtn.style.boxShadow = "0 0 10px #0f0"; // Added glow for visibility
            } else {
                adminUnlockBtn.style.color = "";
                adminUnlockBtn.style.borderColor = "";
                adminUnlockBtn.style.boxShadow = "";
            }

            checkCircuitState(); 
        });
    }

    // 3. SETUP UNSCREW LISTENER INDEPENDENTLY
    const btnAdminUnscrew = el('btn-admin-unscrew');
    if (btnAdminUnscrew) {
        btnAdminUnscrew.addEventListener('click', () => {
            console.log("ADMIN: Removing Back Panel");

            if (pda && !pda.classList.contains('flipped')) {
                pda.classList.add('flipped');
            }

            const screws = document.querySelectorAll('.screw');
            screws.forEach((screw, index) => {
                setTimeout(() => {
                    screw.classList.add('removed');
                }, index * 100);
            });

            setTimeout(() => {
                if (backPanel) {
                    backPanel.classList.add('unlocked');
                    backPanel.classList.add('detached');
                }
            }, 800);
        });
    }
    
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

        initializeBookSystem(el);

        initializeShineEffect();

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
    function initializeDraggableItems() {
        const items = document.querySelectorAll('.drawer-item');
        const drawerZone = document.getElementById('drawerDropZone');
        const drawerPanel = document.querySelector('.top-right-drawer-panel');

        const screws = document.querySelectorAll('.screw');
        const resistorSlots = document.querySelectorAll('.resistor-slot');
        const powerBtn = document.getElementById('powerOn');
        
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

        // --- NEW HELPER: CHECK BOTH TERMINAL SLOTS ---
        const checkTerminalReady = (ignoredItem = null) => {
            const slot4 = document.getElementById('slot-r4');
            const slot5 = document.getElementById('slot-r5');
            
            // Helper to see if a valid resistor is inside
            const isValid = (slot) => {
                if (!slot || slot.children.length === 0) return false;
                const r = slot.children[0];
                if (r === ignoredItem) return false; // Ignore if currently being dragged/picked up
                
                // Re-validate just to be sure
                const res = validateResistorDrop(r, slot);
                return res.success;
            };

            return isValid(slot4) && isValid(slot5);
        };

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
            setTimeout(() => {
                if (backPanel) backPanel.classList.remove('detached');
            }, 600);

            setTimeout(() => {
                if (pda) pda.classList.remove('flipped');
            }, 1200);
            
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
                
    
                    if (item.parentElement && item.parentElement.id) {
                        if (item.parentElement.id === 'slot-r2') {
                            state.unlockedFeatures.nanochat = false;
                            renderPrograms(); // Re-render to grey it out
                        }
                    }
                    if (item.parentElement && item.parentElement.classList.contains('resistor-slot')) {
                        item.parentElement.style.boxShadow = "";
                    }

                    // 1. Reset Board State
                    document.querySelectorAll('.pcb-overlay').forEach(ov => ov.classList.remove('active'));
                    
                    if (powerBtn) {
                        powerBtn.textContent = "System Error";
                        powerBtn.style.backgroundColor = "#555";
                        powerBtn.disabled = true;
                        powerBtn.style.cursor = "not-allowed";
                    }

                    // 2. Re-Scan Remaining Slots
                    const allSlots = document.querySelectorAll('.resistor-slot');
                    allSlots.forEach(slot => {
                        if (slot.children.length > 0) {
                            const resistor = slot.children[0];
                            if (resistor === item) return; 

                            const result = validateResistorDrop(resistor, slot);
                            
                            if (result.success) {
                                slot.style.boxShadow = "0 0 15px #0f0, inset 0 0 10px #0f0";
                                
                                if (result.feature) {
                                    state.unlockedFeatures[result.feature] = true;
                                    renderPrograms(); 
                                }
                                
                                if (result.effects) {
                                    result.effects.forEach(cls => {
                                        if (cls === 'overlay-terminal' && !checkTerminalReady()) return;
                                        const el = document.querySelector('.' + cls);
                                        if (el) el.classList.add('active');
                                    });
                                }
                    
                                if (result.action === 'repair') {
                                    // 🟢 ADD THIS LINE: Update progress immediately
                                    markPuzzleComplete('fix_power'); 
                                    
                                    repairPDA();
                                }
                                
                                checkCircuitState(); 
                            }
                        
                        }
                    });
                    setTimeout(() => {
                        checkCircuitState(); // NOW THIS WORKS!
                    }, 50);
                }
                
                const rect = item.getBoundingClientRect();
                
                let targetWidth = rect.width;
                let targetHeight = rect.height;

                if (isUnplacing) {
                    targetWidth = 40; 
                    targetHeight = 10;
                }

                const centerOffsetX = targetWidth / 2;
                const centerOffsetY = targetHeight / 2;

                const wasFloating = item.classList.contains('floating');

                if (!wasFloating) {
                    item.style.left = (e.clientX - centerOffsetX) + 'px';
                    item.style.top = (e.clientY - centerOffsetY) + 'px';
                    
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
                    item.style.left = (moveEvent.clientX - centerOffsetX) + 'px';
                    item.style.top = (moveEvent.clientY - centerOffsetY) + 'px';
                };

                const onMouseUp = (upEvent) => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    if (item.classList.contains('screwdriver-prop')) {
                        screws.forEach(screw => {
                            if (!screw.classList.contains('removed') && isOverlapping(item, screw)) {
                                screw.classList.add('removed');
                                const a = new Audio('/Audio/click_fast.ogg'); 
                                checkPanelStatus();
                            }
                        });
                    }

                    if (item.classList.contains('resistor-prop')) {
                        const allSlots = document.querySelectorAll('.resistor-slot');
                        let placedSuccessfully = false;

                        allSlots.forEach(slot => {
                            if (slot.children.length > 0) return;

                            if (backPanel && backPanel.classList.contains('detached') && isOverlapping(item, slot)) {
                                
                                item.style.position = 'absolute';
                                item.classList.remove('floating');
                                item.style.left = ''; 
                                item.style.top = '';
                                item.style.width = ''; 
                                item.style.height = '';
                                item.style.transform = ''; 
                                item.classList.add('placed');
                                
                                slot.innerHTML = '';
                                slot.appendChild(item);
                                placedSuccessfully = true;

                                const result = validateResistorDrop(item, slot);

                                if (result.success) {
                                    slot.style.boxShadow = "0 0 15px #0f0, inset 0 0 10px #0f0";
                                if (result.feature) {
                                        state.unlockedFeatures[result.feature] = true;
                                        renderPrograms(); // Re-render to enable the button
                                    }
                                    if (result.effects) {
                                        result.effects.forEach(cls => {
                                            // SPECIAL CHECK FOR TERMINAL OVERLAY
                                            if (cls === 'overlay-terminal' && !checkTerminalReady()) return;

                                            const el = document.querySelector('.' + cls);
                                            if (el) el.classList.add('active');
                                        });
                                    }

                                    if (result.action === 'repair') {
                                        repairPDA();
                                    }
                                    checkCircuitState(); // NOW THIS WORKS!
                                }
                            }
                        });

                        if (placedSuccessfully) return;
                    }

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