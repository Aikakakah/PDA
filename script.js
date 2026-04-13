import { createNewsModule } from './news.js';
import { createMusicModule } from './music.js';
import { createSecretHandler } from './secret_handler.js';
import { validateResistorDrop } from './Circuit/circuit.js';
import { initializeBookSystem } from './Book/book.js'; 
import { createNanoChatTriggers } from './nanochat_triggers.js';
import { createTerminalBridge } from './terminal_bridge.js';
import { SYSTEM_VERSION, CHANGELOG_CONTENT } from './changelog.js';
import { RULES_CONTENT } from './rules.js';
import { 
    createRingtoneModalMarkup, 
    createIdentityModalMarkup, 
    createChangelogModalMarkup, 
    createOSModalMarkup,
    createNanoChatNewContactModal,
    createRulesModalMarkup
} from './modal.js';

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

// --- Glitch Effect Class ---
const GLITCH_CHARS = "☺Σ×Π#-_¯—→↓↑←0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";

// class GlitchControllerOld {
//     constructor(element) {
//         this.selector = element;
//         this.originalText = element.textContent;
//         this.isGlitched = false;
//         this.timeouts = [];
//     }

//     start() {
//         if (this.isGlitched) return;
//         this.isGlitched = true;
//         this.loop();
//     }

//     stop() {
//         this.isGlitched = false;
//         this.timeouts.forEach(t => clearTimeout(t));
//         this.timeouts = [];
//         this.selector.textContent = this.originalText;
//     }

//     loop() {
//         if (!this.isGlitched) return;

//         // Randomize settings per cycle to mimic the original effect
//         const randLetterNumber = 2 + Math.floor(Math.random() * 8);
//         const randGlitchPauseTime = 100 + Math.floor(Math.random() * 2500);
        
//         // Prepare indices to glitch
//         const charArray = this.originalText.split("");
//         const indices = [];
//         for(let i=0; i < randLetterNumber; i++) {
//             indices.push(Math.floor(Math.random() * charArray.length));
//         }

//         // Run the fast flicker effect
//         let count = 0;
//         const maxCount = Math.floor(200 / 65); // derived from original 200ms duration / 65ms per letter

//         const flicker = () => {
//             if (!this.isGlitched) return;
            
//             if (count >= maxCount) {
//                 // End of this glitch cycle, wait then loop
//                 this.selector.textContent = this.originalText;
//                 this.timeouts.push(setTimeout(() => this.loop(), randGlitchPauseTime));
//             } else {
//                 // Randomize characters
//                 let tempString = [...charArray];
//                 for(let i=0; i < indices.length; i++) {
//                     const randChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
//                     const idx = indices[i];
//                     if (tempString[idx] !== ' ') tempString[idx] = randChar;
//                 }
//                 this.selector.textContent = tempString.join("");
//                 count++;
//                 this.timeouts.push(setTimeout(flicker, 65));
//             }
//         };

//         flicker();
//     }
// }
class GlitchController {
    constructor(element) {
        this.element = element;
        this.originalText = element.textContent;
        this.chars = "░▒▓<>/▗▚▞Σ×Π#-_¯0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
        this.isGlitched = false;
        this.raf = null;
        this.frame = 0;
        this.glitchedText = this.originalText;
    }

    // Starts the continuous "gibberish" scramble
    start() {
        if (this.isGlitched) return;
        this.isGlitched = true;
        // Start with fully scrambled text
        this.glitchedText = this.originalText
            .split('')
            .map(char => (char === ' ' ? ' ' : this.chars[Math.floor(Math.random() * this.chars.length)]))
            .join('');
        this.element.textContent = this.glitchedText;
        // Prevent line height changes from varying character heights
        this.element.style.lineHeight = '1';
        this.loop();
    }

    // Stops immediately and shows original text
    stop() {
        this.isGlitched = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        this.element.textContent = this.originalText;
        // Reset line height
        this.element.style.lineHeight = '';
    }

    // Continuous scramble loop
    loop() {
        if (!this.isGlitched) return;

        // Change one random character every second (assuming 60fps)
        if (this.frame % 30 === 0) {
            const positions = [];
            for (let i = 0; i < this.originalText.length; i++) {
                if (this.originalText[i] !== ' ') positions.push(i);
            }
            if (positions.length > 0) {
                const randomIndex = positions[Math.floor(Math.random() * positions.length)];
                const newText = this.glitchedText.split('');
                newText[randomIndex] = this.chars[Math.floor(Math.random() * this.chars.length)];
                this.glitchedText = newText.join('');
                this.element.textContent = this.glitchedText;
            }
        }

        this.frame++;
        this.raf = requestAnimationFrame(() => this.loop());
    }

    // resolve() performs a "scramble-to-reveal" animation over time
    resolve() {
        this.isGlitched = false;
        if (this.raf) cancelAnimationFrame(this.raf);

        let iteration = 0;
        const interval = setInterval(() => {
            this.element.textContent = this.originalText
                .split("")
                .map((char, index) => {
                    // Once iteration passes the character index, show the real letter
                    if (index < iteration) return this.originalText[index];
                    if (char === " ") return " ";
                    return this.chars[Math.floor(Math.random() * this.chars.length)];
                })
                .join("");

            if (iteration >= this.originalText.length) {
                clearInterval(interval);
            }
            // Controlling the speed of the reveal
            iteration += 15; 
        }, 120);
    }
}
//#region Date format
function formatSolTimestamp() {
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `SOL-${month}${day}.${hours}${seconds}`;
}
//#endregion

//#region Resistors
function randomizeResistorsInDrawer() {
    const kit = document.querySelector('.resistor-kit');
    if (!kit) return;

    // Ensure the kit is positioned, and use its client dimensions to bound placement
    const kitWidth = kit.clientWidth;
    const kitHeight = kit.clientHeight;
    const padding = 8; // keep a small gap from edges so visuals don't touch borders

    const resistors = kit.querySelectorAll('.resistor-prop');
    resistors.forEach(res => {
        // Ensure absolute positioning is used for random placement
        res.style.position = 'absolute';

        // Measure resistor size (fallback to expected defaults)
        const resW = res.offsetWidth || 40;
        const resH = res.offsetHeight || 10;

        // Compute allowed bounds so the resistor fully fits inside the kit
        const maxX = Math.max(0, kitWidth - resW - padding);
        const maxY = Math.max(0, kitHeight - resH - padding);

        const randomX = (Math.random() * maxX) + (padding / 2);
        const randomY = (Math.random() * maxY) + (padding / 2);

        // Limit rotation to avoid visual overhang while still looking scattered
        const randomRot = (Math.random() * 160) - 80; // -20deg .. +20deg

        res.style.left = `${randomX}px`;
        res.style.top = `${randomY}px`;
        res.style.transform = `rotate(${randomRot}deg)`;
    });
}

const resistorVisuals = {
    '100': { b1: '#964B00', b2: '#000', b3: '#964B00', b4: '#D4AF37' },
    '220': { b1: '#E74C3C', b2: '#E74C3C', b3: '#964B00', b4: '#D4AF37' },
    '10k': { b1: '#964B00', b2: '#000', b3: '#E67E22', b4: '#D4AF37' },
    '10':  { b1: '#964B00', b2: '#000', b3: '#000',    b4: '#D4AF37' }
};
//#endregion
    
//#region Hash
function getPersistentHash() {
    let hash = localStorage.getItem('pda_global_hash');
    if (!hash) {
        hash = '0x' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase();
        localStorage.setItem('pda_global_hash', hash);
    }
    return hash;
}

function rotatePersistentHash() {
    // Called when a puzzle is solved to "evolve" the OS version
    const newSegment = Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0');
    let current = localStorage.getItem('pda_global_hash') || "0x00";
    // Append or modify the hash to make it look like a growing chain
    if(current.length > 12) {
        current = '0x' + newSegment + Math.floor(Math.random()*9999);
    } else {
        current += `-${newSegment}`;
    }
    localStorage.setItem('pda_global_hash', current);
    return current;
}

function applyNewHash(input) {
    if (!input) return false;
    input = input.trim();

    // --- ATTEMPT 1: Transfer Token (Base64) ---
    try {
        // Attempt to decode Base64
        const jsonStr = atob(input); 
        const data = JSON.parse(jsonStr);

        // Verify it has the essential data
        if (data.hash && (data.nanochat || data.slots)) {
            localStorage.setItem('pda_global_hash', data.hash);

            // Construct a save file from the token
            // FIX: Added fallbacks to 'state' to prevent overwriting with undefined if token is partial
            const newSaveState = {
                unlockedFeatures: data.unlocked || state.unlockedFeatures,
                puzzles: data.puzzles || [],
                slots: data.slots || {},
                poweredOn: data.powered !== undefined ? data.powered : state.poweredOn,
                nanochat: data.nanochat || state.nanochat, 
                notes: data.notes || state.notes
            };

            localStorage.setItem('pda_game_state', JSON.stringify(newSaveState));
            location.reload();
            return true;
        }
    } catch (e) {
        // Not a valid transfer token, ignore and try legacy hash
    }

    // --- ATTEMPT 2: Legacy Hex Hash ---
    const hashPattern = /^[0-9A-Fx-]+$/i; 
    if (hashPattern.test(input)) {
        localStorage.setItem('pda_global_hash', input.toUpperCase());
        // Standard hash change resets progress (New Game+)
        localStorage.removeItem('pda_game_state');
        localStorage.removeItem('pda_user_identity');
        location.reload();
        return true;
    }

    return false;
}
// #endregion

// Global State Declaration
const savedIdentity = localStorage.getItem('pda_user_identity');
const defaultOwner = "Ramona Orthall";
const cubeWrapper = document.getElementById('cubeWrapper');
const panUpBtn = document.getElementById('panUpBtn');
const panDownBtn = document.getElementById('panDownBtn');

const state = {
    owner: defaultOwner,
    id: savedIdentity || "Unknown", 
    job: "Passenger",
    station: "NTTD Manta Station PR-960",
    alert: "Green",
    instructions: "Don't stray far.",
    currentDate: new Date(),
    shiftStart: Date.now(),
    flashlight: false,
    stylus: false,
    hasUnreadNews: false,
    hasUnreadNanoChat: false,
    hasUnreadTerminal: false,
    pendingConnection: null, 
    poweredOn: false, // Default to false, load will update
    unlockedFeatures: {
        notekeeper: false,
        nanochat: false,
        news: false,
        music: false,
        terminal: false,
        ringtone: false,
        power: false 
    },
    puzzles: new Set(),
    totalPuzzles: 7,
    systemVersion: SYSTEM_VERSION, 
    systemOSName: "Robust#OS",
    systemHash: getPersistentHash(),
    adminOverride: false,
    messagedCrew: new Set(),

    programs: [
        { uid: 1, name: "Crew manifest", icon: "CM", type: "manifest" },
        { uid: 2, name: "Notekeeper", icon: "NK", type: "notekeeper" },
        { uid: 3, name: "Station news", icon: "News", type: "news" },
        { uid: 4, name: "NanoChat", icon: "NC", type: "nanochat" },
        { uid: 5, name: "Music Player", icon: "MP", type: "music" },
        { uid: 6, name: "Terminal", icon: ">_", type: "terminal" }
    ],
    notes: ["Check filter", "Bring gloves"],
    crew: [
        { name: "Sam Nighteyes", rank: "Dignitary", role: "Blueshield Officer" },
        { name: "Claire Vallis", rank: "Command", role: "Captain" },
        { name: "Lexi Tachibana-Hawking", rank: "Command", role: "Head of Personnel" },
        { name: "Ronin T. Pallas", rank: "Command", role: "Head of Research and Development" },
        { name: "Sandy Deathshed", rank: "Command", role: "Head of Security" },
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
                number: "555-0199",
                messages: [
                    { sender: "Sam", text: "Alert: Unauthorized access detected at Cargo Bay 3. Security on site. Standby for updates.", type: "received" },
                    { sender: "Ramona", text: "Understood. Maintaining distance from the area.", type: "sent" }
                ]
            },
            batbayar: {
                name: "Batbayar Levinstruck",
                number: "555-2342",
                messages: [
                    { sender: "Batbayar", text: "Hey Ramona, saw you in the lab. Still working on that warp core analysis?", type: "received" }
                ]
            }
        }
    },
    music: {
        currentTrack: 0,
        isPlaying: false
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

RULES_CONTENT.forEach(cat => {
    cat.items.forEach(item => {
        if (item.image) {
            const img = new Image();
            img.src = item.image;
        }
    });
});

(async () => {
    
    const preloadedNotes = {};
    // const noteNames = ["a","asharp","b","c","csharp","d","dsharp","e","f","fsharp","g","gsharp"];
    const noteNames = ["a","b","c","d","e","f","g"];
    
    for (const n of noteNames) {
        const a = new Audio(`/Audio/${n}.ogg`);
        a.preload = "auto";
        preloadedNotes[n] = a;
    }
    
    state.currentDate.setFullYear(state.currentDate.getFullYear() + 630);
    document.body.insertAdjacentHTML('beforeend', createRingtoneModalMarkup(state.settings.ringtone));
    
    document.body.insertAdjacentHTML('beforeend', createOSModalMarkup(state.systemHash));
    document.body.insertAdjacentHTML('beforeend', createIdentityModalMarkup());
    

    // --- Variables ---
    let pda = null;
    let views = {};
    let tabs = null;
    let programGrid = null;
    let btnEject = null;
    let btnStylus = null;
    let btnFull = null;
    let btnPower = null;
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
   
    let backPanel = null;

    let newsModule = null;
    let secretHandler = null;
    let musicModule = null;
    
    let changelogList = null;
    let rulesList = null;
    let rulesToc = null;

    let osCopyModal = null;
    let osModalDisplay = null;
    let osPasteInput = null;
    let pasteFeedback = null;
    let applyOsBtn = null;

    let stationGlitch = null;
    let manifestGlitches = [];
   
    // --- MODAL ASSIGNMENT AND HANDLERS ---
    ringtoneModal = document.getElementById('ringtoneModal');
    closeRingtoneModal = document.getElementById('closeRingtoneModal');
    ringtoneDisplay = document.getElementById('ringtoneDisplay');
    testRingtoneBtn = document.getElementById('testRingtoneBtn');
    setRingtoneBtn = document.getElementById('setRingtoneBtn');
    ringtoneRow = document.getElementById('ringtoneRow');
    
    if (ringtoneRow) {
        ringtoneRow.addEventListener('click', () => {
            ringtoneModal?.classList.remove('hidden'); 
        });
    }

    // --- ADMIN: Export Page Logic ---
//#region --- ADMIN: Export Page Logic (Open in New Tab) ---
const exportBtn = document.getElementById('btn-admin-export');

if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
        const allPages = document.querySelectorAll('.my-page');
        if (allPages.length === 0) return;

        const visiblePages = Array.from(allPages).filter(page => {
            const style = window.getComputedStyle(page);
            return style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden';
        });

        let targetEl = null;
        if (visiblePages.length > 1) {
            const isLeft = confirm("Copy the LEFT page to clipboard?\n\n(Click 'OK' for Left, 'Cancel' for Right)");
            targetEl = isLeft ? visiblePages[0] : visiblePages[1];
        } else {
            targetEl = visiblePages[0];
        }

        if (!targetEl) return;

        const originalIcon = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        exportBtn.style.pointerEvents = 'none';

        try {
            const targetWidth = 1104;
            const targetHeight = 1452;
            
            // 1. Increase the scale slightly more than needed to ensure 
            // we over-capture the edges (prevents the 1103px rounding error)
            const exactScale = (targetWidth / targetEl.offsetWidth) * 1.01;

            const rawCanvas = await html2canvas(targetEl, {
                useCORS: true,
                backgroundColor: null,
                scale: exactScale, 
                logging: false,
                // These settings help prevent edge-clipping
                width: targetEl.offsetWidth,
                height: targetEl.offsetHeight,
                scrollX: 0,
                scrollY: -window.scrollY 
            });

            // 2. Create the strict "Final" canvas
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = targetWidth;
            finalCanvas.height = targetHeight;
            const ctx = finalCanvas.getContext('2d');
            
            // 3. Draw with explicit sizing to fill every pixel
            // This stretches the image by that 1px difference if necessary
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(rawCanvas, 0, 0, targetWidth, targetHeight);

            // 4. Clipboard Export
            finalCanvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        // Small success flash or alert
                        console.log("Exported at exact 1104x1452");
                    } catch (clipboardError) {
                        console.error("Clipboard error:", clipboardError);
                        alert("Could not copy to clipboard.");
                    }
                }
            }, 'image/png');

        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            exportBtn.innerHTML = originalIcon;
            exportBtn.style.pointerEvents = 'auto';
        }
    });
}
//#endregion
//#region Rules
    document.body.insertAdjacentHTML('beforeend', createRulesModalMarkup());

    let rulesModal = null;
    let openRulesModal = null;
    let closeRulesModal = null;

    openRulesModal = document.getElementById('btn-admin-rules');
    closeRulesModal = document.getElementById('closeRulesModal');
    rulesModal = document.getElementById('rulesModal');
    rulesList = document.getElementById('rulesList');
    rulesToc = document.getElementById('rulesToc');
    
    if (openRulesModal) { 
        openRulesModal?.addEventListener('click', openRules); 
    }

    closeRulesModal?.addEventListener('click', () => {
        rulesModal?.classList.add('closing');
        setTimeout(() => {
            rulesModal?.classList.remove('closing');
            rulesModal?.classList.add('hidden');
        }, 250);
    });

    /**
 * Opens the Rules modal and generates the hierarchical Table of Contents 
 * and Rules List content.
 */
    function openRules() {
        if (!rulesModal || !rulesList || !rulesToc) return;
        
        rulesToc.innerHTML = '';
        rulesList.innerHTML = '';

        RULES_CONTENT.forEach((category, index) => {
            // --- 1. Determine Hierarchy Depth ---
            let depth = 0;
            if (category.parentCategory) {
                depth = 1;
                // Find if the parent itself has a parent to identify Level 2 (Sub-Sub)
                const parentObj = RULES_CONTENT.find(c => c.category === category.parentCategory);
                if (parentObj && parentObj.parentCategory) {
                    depth = 2;
                }
            }

            // --- 2. Create Table of Contents (TOC) Item ---
            const tocItem = document.createElement('div');
            let classList = ['toc-item'];
            
            if (depth === 1) {
                classList.push('sub-toc-item');
                tocItem.style.display = 'none'; // Initially hidden
            } else if (depth === 2) {
                classList.push('sub-sub-toc-item');
                tocItem.style.display = 'none'; // Initially hidden
            }
            
            tocItem.className = classList.join(' ');
            tocItem.textContent = category.category;
            tocItem.dataset.category = category.category;
            tocItem.dataset.parent = category.parentCategory || ''; // Link for toggle logic
            
            // TOC Click Behavior: Scroll to content and expand
            tocItem.addEventListener('click', () => {
                const target = rulesList.children[index];
                if (!category.alwaysExpanded) {
                    target.classList.add('expanded');
                    // Ensure sub-items in TOC reveal if this item is a parent
                    toggleTOCSubgroups(category.category, true);
                }
                
                rulesList.scrollTo({
                    top: target.offsetTop - 10,
                    behavior: 'smooth'
                });
            });
            
            rulesToc.appendChild(tocItem);

            // --- 3. Create Rules Content Entry ---
            const entry = document.createElement('div');
            entry.className = 'rules-entry' + (category.alwaysExpanded ? ' expanded' : '');
            
            let contentHtml = '';
            let inList = false;
            category.items.forEach(item => {
                const imgHtml = item.image ? `<img src="${item.image}" class="rules-image" loading="lazy">` : '';
                if (item.bullet) {
                    if (!inList) { contentHtml += '<ul class="rules-items">'; inList = true; }
                    contentHtml += `<li>${item.text}${imgHtml}</li>`;
                } else {
                    if (inList) { contentHtml += '</ul>'; inList = false; }
                    contentHtml += `<div class="rules-text-entry">${item.text}${imgHtml}</div>`;
                }
            });
            if (inList) contentHtml += '</ul>';

            // Header displays hierarchy styling via muted text for subs
            entry.innerHTML = `
                <div class="rules-header" style="${category.alwaysExpanded ? 'cursor: default;' : ''}">
                    <span style="${depth > 0 ? 'font-size: 0.9em; color: var(--muted);' : ''}">
                        ${category.category}
                    </span>
                    ${category.alwaysExpanded ? '' : '<span class="arrow"><i class="fas fa-chevron-right"></i></span>'}
                </div>
                ${contentHtml}
            `;
            
            // Toggle logic for the content header
            if (!category.alwaysExpanded) {
                entry.querySelector('.rules-header').addEventListener('click', () => {
                    const isExpanded = entry.classList.toggle('expanded');
                    // Trigger visibility of children in the TOC
                    toggleTOCSubgroups(category.category, isExpanded);
                });
            }

            rulesList.appendChild(entry);
        });

        rulesModal.classList.remove('hidden'); 
    }

        // Helper to find and toggle visibility of sub-subgroups in the TOC
        function toggleTOCSubgroups(parentName, show) {
            // Select all TOC items that list this category as their parent
            const children = document.querySelectorAll(`.rules-toc .toc-item[data-parent="${parentName}"]`);
            
            children.forEach(child => {
                child.style.display = show ? 'block' : 'none';
                
                // If we are hiding a parent, recursively hide all its descendants
                if (!show) {
                    const childCategoryName = child.dataset.category;
                    toggleTOCSubgroups(childCategoryName, false);
                    
                    // Also ensure the corresponding content entry is collapsed
                    // This keeps the TOC and Content views in sync
                    const entries = document.querySelectorAll('.rules-entry');
                    entries.forEach(entry => {
                        const headerText = entry.querySelector('.rules-header span').textContent.trim();
                        if (headerText === childCategoryName) {
                            entry.classList.remove('expanded');
                        }
                    });
                }
            });
        }
    //#endregion

    //#region --- CHANGELOG ---
    document.body.insertAdjacentHTML('beforeend', createChangelogModalMarkup(state.systemVersion));

    let changelogModal = null;
    let openChangelogModal = null;
    let closeChangelogModal = null;

    openChangelogModal = document.getElementById('openChangelogModal');
    closeChangelogModal = document.getElementById('closeChangelogModal');
    changelogModal = document.getElementById('changelogModal');
    changelogList = document.getElementById('changelogList');
    
    if (openChangelogModal) { 
        openChangelogModal?.addEventListener('click', openChangelog); 
    }

    closeChangelogModal?.addEventListener('click', () => {
        changelogModal?.classList.add('closing');
        setTimeout(() => {
            changelogModal?.classList.remove('closing');
            changelogModal?.classList.add('hidden');
        }, 250);
    });
    
    function openChangelog() {
        if (!changelogModal || !changelogList) return;
        changelogList.innerHTML = CHANGELOG_CONTENT.map(entry => `
            <div class="changelog-entry">
                <div class="changelog-ver">${entry.version} <span class="changelog-date">${entry.date}</span></div>
                <ul class="changelog-items">
                    ${entry.changes.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        `).join('');
        changelogModal.classList.remove('hidden'); 
    }
    //#endregion
    
    //#region --- ID CARD ---
    let closeIdentityModal = null;
    closeIdentityModal = document.getElementById('closeIdentityModal');

    closeIdentityModal?.addEventListener('click', () => {
        identityModal?.classList.add('closing');
        setTimeout(() => {
            identityModal?.classList.remove('closing');
            identityModal?.classList.add('hidden');
        }, 250);
    });
 //#endregion
    //#region --- NANOCHAT --- 
    let nanoChatTriggers = null; 

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
                <input id="chatInput" placeholder="Message ${state.nanochat.channels[state.nanochat.currentContact].name}" />
                <button id="chatSendBtn"><i class="fas fa-paper-plane"></i></button>
            </div>
            `;
        programArea.appendChild(wrap);
        wrap.insertAdjacentHTML('beforeend', createNanoChatNewContactModal());
    
        const sidebar = el('chatSidebar');
        const messagesContainer = el('chatMessages');
        const input = el('chatInput');
        const sendBtn = el('chatSendBtn');
        const createBtn = el('createNewChatBtn');
        const newChatBtn = el('newChatBtn'); 
        const newChatModal = el('newChatModal');
        const contactNameInput = el('newContactName');
        const contactNumberInput = el('newContactNumber');
        
        newChatBtn.addEventListener('click', () => {
            newChatModal.classList.remove('hidden');
            contactNameInput.focus();
        });
        
        const cancelBtn = el('cancelNewChatBtn');
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
                    number: number, 
                    messages: []
                };
                saveGameProgress();
                
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
                
                if (contactId === state.nanochat.currentContact) {
                    contactDiv.classList.add('active');
                    if (input) input.placeholder = `Message ${channel.name}`;
                    
                    contactDiv.innerHTML = `
                        <div class="contact-name">${channel.name}</div>
                        <div class="contact-number">${channel.number || 'Unknown'}</div>
                    `;
                } else {
                    contactDiv.textContent = channel.name;
                }
        
                contactDiv.dataset.contactId = contactId;
                
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
                    sender: state.id, 
                    text: text,
                    type: "sent"
                });
                const currentContactName = state.nanochat.channels[state.nanochat.currentContact].name;
                if (!state.messagedCrew.has(currentContactName)) {
                    state.messagedCrew.add(currentContactName);
                }
                if (nanoChatTriggers) {
                    nanoChatTriggers.checkAndTrigger(currentContactName, text);
                    markPuzzleComplete('secret_chat');
                }

                saveGameProgress();
                input.value = '';
                renderMessages();
                
            }
        }
    
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
    
        renderSidebar();
        renderMessages();
    }
    //#endregion
    //#region --- SAVE / LOAD SYSTEM, Game progress ---
    function saveGameProgress() {
        const slots = {};
        const resistorSlots = document.querySelectorAll('.resistor-slot');
        
        // Map current board state
        resistorSlots.forEach(slot => {
            if (slot.children.length > 0) {
                const resistor = slot.children[0];
                slots[slot.id] = resistor.dataset.ohms;
            }
        });

        const saveData = {
            unlockedFeatures: state.unlockedFeatures,
            puzzles: Array.from(state.puzzles),
            slots: slots,
            poweredOn: state.poweredOn,
            nanochat: state.nanochat, 
            notes: state.notes,
            messagedCrew: Array.from(state.messagedCrew)
        };

        localStorage.setItem('pda_game_state', JSON.stringify(saveData));
    }
    
    function getTransferToken() {
        // 1. Scrape current board state (identical to save logic)
        const currentSlots = {};
        document.querySelectorAll('.resistor-slot').forEach(slot => {
            if (slot.children.length > 0) {
                currentSlots[slot.id] = slot.children[0].dataset.ohms;
            }
        });

        // 2. Bundle relevant data
        const payload = {
            hash: state.systemHash,
            notes: state.notes,
            nanochat: state.nanochat,
            slots: currentSlots,
            puzzles: Array.from(state.puzzles),
            unlocked: state.unlockedFeatures,
            powered: state.poweredOn
        };

        // 3. Encode to Base64
        return btoa(JSON.stringify(payload));
    }
    
    function createResistorDOM(ohms) {
        const visuals = resistorVisuals[ohms] || resistorVisuals['100'];
        const el = document.createElement('div');
        el.className = 'drawer-item resistor-prop placed';
        el.dataset.ohms = ohms;
        el.title = `${ohms} Ohm Resistor`;
        el.style.position = 'absolute';
        el.style.top = '50%';
        el.style.left = '50%';
        el.style.transform = 'translate(-50%, -50%) rotate(90deg)';
        el.style.pointerEvents = 'auto'; 

        const body = document.createElement('div');
        body.className = 'resistor-body';
        body.style.setProperty('--b1', visuals.b1);
        body.style.setProperty('--b2', visuals.b2);
        body.style.setProperty('--b3', visuals.b3);
        body.style.setProperty('--b4', visuals.b4);
        
        el.appendChild(body);
        return el;
    }
    
    function restoreGameProgress() {
        const rawData = localStorage.getItem('pda_game_state');
        if (!rawData) return;
        try {
            const data = JSON.parse(rawData);
            
            // 1. Restore Logic State
            if (data.unlockedFeatures) state.unlockedFeatures = data.unlockedFeatures;
            if (data.puzzles) state.puzzles = new Set(data.puzzles);
            if (data.poweredOn !== undefined) state.poweredOn = data.poweredOn;
            if (data.nanochat) state.nanochat = data.nanochat;
            if (data.notes) state.notes = data.notes;
            if (data.messagedCrew) state.messagedCrew = new Set(data.messagedCrew);

            // 2. Restore Physical Resistors
            if (data.slots) {
                Object.entries(data.slots).forEach(([slotId, ohms]) => {
                    const slot = document.getElementById(slotId);
                    if (slot && slot.children.length === 0) {
                        
                        // Attempt to find an existing resistor in the drawer first
                        // This prevents duplicating resistors (one in slot, one left in drawer)
                        let resistor = document.querySelector(`.resistor-kit .resistor-prop[data-ohms="${ohms}"]`);
                        
                        if (resistor) {
                            // Move the existing drawer item to the slot
                            resistor.classList.add('placed');
                            resistor.classList.remove('floating'); // Ensure clean state
                            
                            // Apply placement styles
                            resistor.style.position = 'absolute';
                            resistor.style.top = '50%';
                            resistor.style.left = '50%';
                            resistor.style.transform = 'translate(-50%, -50%) rotate(90deg)';
                            resistor.style.pointerEvents = 'auto';
                        } else {
                            // Fallback if not found (or if we have multiple of same ohms needed)
                            resistor = createResistorDOM(ohms);
                        }

                        slot.appendChild(resistor);
                        
                        // Re-trigger validation to show wires/overlays
                        const result = validateResistorDrop(resistor, slot);
                        if (result.success) {
                            slot.style.boxShadow = "0 0 15px #0f0, inset 0 0 10px #0f0";
                            if (result.effects) {
                                result.effects.forEach(cls => {
                                    if (cls === 'overlay-terminal') {
                                        const r4 = document.getElementById('slot-r4');
                                        const r5 = document.getElementById('slot-r5');
                                        const hasR4 = r4?.children.length > 0;
                                        const hasR5 = r5?.children.length > 0;
                                        if (!hasR4 || !hasR5) return;
                                    }
                                    const el = document.querySelector('.' + cls);
                                    if (el) el.classList.add('active');
                                });
                            }
                        }
                    }
                });
            }
            renderPrograms();
            
            // 4. Handle Power Button State on Restore
            if (state.puzzles.has('fix_power')) {
                const powerBtn = document.getElementById('powerOn');
                if (powerBtn) {
                    powerBtn.disabled = false;
                    powerBtn.textContent = "Power On";
                    powerBtn.style.backgroundColor = ""; 
                    powerBtn.style.cursor = "pointer";
                }
            }
            
            if (state.poweredOn) {
                    const pdaScreen = document.querySelector('.PDA-screen');
                    const powerOverlay = document.getElementById('powerOverlay');
                    if(powerOverlay) powerOverlay.classList.add('hidden');
                    if(pdaScreen) pdaScreen.classList.remove('screen-off');
            }

        } catch (e) {
            console.error("Failed to load save game", e);
        }
    }
    
    function resetGameProgress() {
        if(confirm("Are you sure you want to reset all progress? This will lock the PDA and remove all repairs.")) {
            localStorage.removeItem('pda_game_state');
            localStorage.removeItem('pda_user_identity');
            location.reload();
        }
    }
     //#endregion
    
    //#region Discord bridge
     const el = id => document.getElementById(id);
    
    const discordBridge = createTerminalBridge('http://localhost:3000', (msg) => {
        const logEntry = { 
            source: "EXTERNAL", 
            author: msg.author, 
            timestamp: msg.solTimestamp,
            content: msg.content,
            type: "system"
        };
        
        state.terminalHistory.push(logEntry);

        const outputDiv = document.getElementById('termOutput');
        if (outputDiv) {
            const inputField = document.getElementById('termInput');
            if(inputField) {
                 const terminalView = document.getElementById('view-program');

                 if(terminalView && terminalView.innerHTML.includes('terminal-console')) {
                     const history = state.terminalHistory;
                     const prevMsg = history[history.length - 2];
                     
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
            }
        }
    });
    discordBridge.start();
     //#endregion
    
    function showView(v) {
        if (!views || Object.keys(views).length === 0) return;
        Object.values(views).forEach(x => x?.classList?.remove('active'));
        if (views[v]) views[v].classList.add('active');

        const progHeader = el('progHeader');
        if (progHeader) {
            progHeader.style.display = (v === 'program' ? 'flex' : 'none');
        }
    }

    //#region SHINE EFFECT
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
     //#endregion

    function updateHome() {
        if (el('owner')) el('owner').textContent = state.owner; 
        if (el('idline')) el('idline').innerHTML = `${state.id}, <span id="job" class="job">${state.job}</span>`; 
        // if (el('station')) el('station').textContent = state.station;
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
    
    function markPuzzleComplete(id) {
        if (!state.puzzles.has(id)) {
            state.puzzles.add(id);
            // UPDATE THE OS HASH ON SUCCESS
            state.systemHash = rotatePersistentHash();
            saveGameProgress(); 
        }
    }

    //#region --- SYSTEM STATUS RENDERING ---
    function renderSystemStatus() {
        const progressBar = el('statusProgressBar');
        const percentageText = el('statusPercentageText');
        const statusHardware = el('statusHardware');
        const statusSoftware = el('statusSoftware');
        const statusSecrets = el('statusSecrets');
        const statusVersion = el('statusVersion');
        const statusOS = el('statusOS');
        
        // Define puzzle completion logic
        const hardwareIds = ['fix_power', 'fix_nanochat', 'fix_notekeeper', 'fix_news', 'fix_terminal'];
        const secretIds = ['secret_ringtone', 'secret_chat'];
        const hardwareDone = hardwareIds.filter(id => state.puzzles.has(id)).length;
        // We calculate secrets using state.puzzles (the correct way), not state.secrets
        const secretsDone = secretIds.filter(id => state.puzzles.has(id)).length;
        const totalDone = state.puzzles.size;
        const percent = Math.min(100, Math.round((totalDone / state.totalPuzzles) * 100));
        
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
        
        // --- THIS SECTION KEEPS THE SECRETS CLICKABLE ---
        if (statusSecrets) {
            statusSecrets.textContent = `${secretsDone} FOUND`;
            statusSecrets.style.color = secretsDone > 0 ? "var(--accent)" : "var(--muted)";
            
            // This click handler opens the File View where the SandyStars file is located
            statusSecrets.onclick = () => {
                if (secretHandler) secretHandler.openFilesView(); 
            };
        }
    
        if (statusVersion) {
            statusVersion.textContent = state.systemVersion;
            statusVersion.classList.add('clickable-status');
            statusVersion.title = "Click to view Changelog";
            const newVer = statusVersion.cloneNode(true);
            statusVersion.parentNode.replaceChild(newVer, statusVersion);
            
            newVer.addEventListener('click', () => {
                openChangelog();
            });
        }
    
        if (statusOS) {
            statusOS.innerHTML = `
                <span class="os-name-part" title="Click for details">${state.systemOSName}</span> 
                <span class="os-hash-part" title="Click to copy">${state.systemHash}</span>
            `;
            
            const namePart = statusOS.querySelector('.os-name-part');
            const hashPart = statusOS.querySelector('.os-hash-part');
    
            namePart.addEventListener('click', (e) => {
                e.stopPropagation();
                openOSModal();
            });
    
            hashPart.addEventListener('click', (e) => {
                e.stopPropagation();
                
                copyToClipboard(getTransferToken());
    
                const originalText = hashPart.textContent;
                hashPart.textContent = "COPIED DATA!"; 
                hashPart.style.color = "#fff";
                setTimeout(() => {
                    hashPart.textContent = originalText;
                    hashPart.style.color = "";
                }, 1000);
            });
        }
    }
 //#endregion
    
    function openOSModal() {
        if (!osCopyModal || !osModalDisplay) return;
        osModalDisplay.textContent = state.systemHash;
        osCopyModal.classList.remove('hidden');
    }
    
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Hash copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }
    
    function renderPrograms() {
        const programGrid = el('programGrid'); 
        if (!programGrid) return;
        programGrid.innerHTML = '';
        
        for (const p of state.programs) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.uid = p.uid;
            
            let isLocked = false;
            
            if (['nanochat', 'notekeeper', 'news', 'music', 'terminal'].includes(p.type)) {
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
        if (manifestGlitches.length > 0) {
            manifestGlitches.forEach(g => g.stop());
            manifestGlitches = [];
        }

        showView('program');
        programArea.innerHTML = '';

        switch (p.type) {
        case 'notekeeper': renderNotekeeper(); break;
        case 'manifest': renderManifest(); break;
        case 'nanochat': 
            // Opening NanoChat clears the unread flag
            state.hasUnreadNanoChat = false;
            saveGameProgress();
            updateStatusLights();
            renderNanoChat(); break;
        case 'news': 
            // Viewing news marks it as read
            state.hasUnreadNews = false;
            saveGameProgress();
            updateStatusLights();
            if (newsModule) newsModule.renderNewsProgram(); 
            break;
        case 'music':
            if (musicModule) musicModule.renderMusicProgram();
            break;
        case 'terminal': 
            // Viewing terminal clears the unread terminal indicator
            state.hasUnreadTerminal = false;
            saveGameProgress();
            updateStatusLights();
            renderTerminal(); break; 
        case 'settings':
                showView('settings');
                document.querySelectorAll('.nav-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
                const ts = el('tab-settings'); if (ts) ts.setAttribute('aria-pressed', 'true');
                break;
            default:
                programArea.innerHTML = `<div class="cartridge-header">${p.name}</div><div class="muted">This cartridge is simulated.</div>`;
        }
    }

    //#region Notekeeper
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
                    saveGameProgress();
                    refreshNotes();
                });
                notesWrap.appendChild(div);
            }
        }
        addBtn.onclick = () => {
            const v = noteInput.value.trim();
            if (v) { state.notes.push(v); noteInput.value = ''; saveGameProgress(); refreshNotes(); }
        };
        noteInput.onkeydown = e => { if (e.key === 'Enter') addBtn.click(); };
        refreshNotes();
    }
    //#endregion
    //#region Manifest
    function renderManifest() {
    const programArea = el('programArea');
    if (!programArea) return;

    // Cleanup previous glitches
    manifestGlitches.forEach(g => g.stop());
    manifestGlitches = [];

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

            const nameEl = document.createElement('div');
            nameEl.className = 'name';
            nameEl.textContent = member.name;

            const roleEl = document.createElement('div');
            roleEl.className = 'role';
            roleEl.textContent = member.role;

            // --- GLITCH & DISCOVERY LOGIC ---
            // Key discovery off of state.messagedCrew (from NanoChat)
            const isDiscovered = state.messagedCrew.has(member.name);

            if (!isDiscovered) {
                const glitch = new GlitchController(nameEl);
                glitch.start();
                manifestGlitches.push(glitch);

                // Option: Clicking the entry triggers the jh3y-style reveal
                entry.style.cursor = 'help';
                entry.addEventListener('click', () => {
                    if (glitch.isGlitched) {
                        glitch.resolve();
                        state.messagedCrew.add(member.name); // Mark as discovered
                        saveGameProgress();
                        entry.style.cursor = 'default';
                    }
                }, { once: true });
            }
            // ---------------------------------

            entry.appendChild(nameEl);
            entry.appendChild(roleEl);
            manifestList.appendChild(entry);
        });
    }
}
    //#endregion
    //#region Terminal
    function renderTerminal() {
        const programArea = document.getElementById('programArea');
        const serialNum = document.getElementById('serial') ? document.getElementById('serial').textContent : "AE-239A";
        const promptText = state.terminalMode === 'CHAT' ? '[NETLINK] user:' : 'user@pda:~#';
        
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
                    div.textContent = `${line.solTimestamp}: ${line.content}`;
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
    
        function executeCommand(cmdRaw) {
            const cmd = cmdRaw.trim();
            if (!cmd) return;
            if (state.pendingConnection) {
                if (cmd.toUpperCase() === 'Y') {
                    state.terminalMode = 'CHAT';
                    discordBridge.start();
                    state.terminalHistory.push({ text: "Connection Accepted. Secure Uplink Established.", type: "system" });
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
                    updateStatusLights();
                } else if (cmd.toUpperCase() === 'N') {
                    state.terminalHistory.push({ text: "Connection Refused.", type: "error" });
                    state.pendingConnection = null;
                    updateStatusLights();
                } else {
                    state.terminalHistory.push({ text: "Invalid input. Accept? [Y/N]", type: "system" });
                }
                renderHistory();
                return;
            }
    
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
                
                case 'pandora':
                    if (stationGlitch) {
                        stationGlitch.stop(); // Stop animation
                        state.terminalHistory.push({ text: "Global system stabilization command accepted.", type: "system" });
                        state.terminalHistory.push({ text: "Visual artifacts purged.", type: "system" });
                        markPuzzleComplete('fix_station_glitch'); // Save progress
                    } else {
                        state.terminalHistory.push({ text: "System is already stable.", type: "standard" });
                    }
                    break;
    
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
    //#endregion

    //#region Ringtone
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
        
        if (newsModule) {
            newsModule.handleNewsArticle(key);
            // New unlocked article should show as unread
            state.hasUnreadNews = true;
            saveGameProgress();
            updateStatusLights();
        }
        
        let i = 0;
        const playNext = async () => { // Add 'async' here
            if (i >= notes.length || i >= RINGTONE_LENGTH) return;
        
            const inputNote = notes[i].toUpperCase();
            let note;

            if (inputNote.length > 1 && inputNote.endsWith('#')) {
                note = inputNote[0].toLowerCase() + 'sharp';
            } else {
                note = inputNote[0]?.toLowerCase();
            }

            if (!note || !preloadedNotes[note]) {
                i++;
                setTimeout(playNext, NOTE_DELAY * 1000);
                return;
            }

            const audio = preloadedNotes[note]?.cloneNode() || new Audio(`${AUDIO_PATH}${note}.ogg`);
            audio.volume = VOLUME;
            
            // Wait for the audio to actually start before ticking the timeout
            try {
                await audio.play(); 
            } catch (e) {
                console.warn("Audio playback failed", e);
            }
        
            i++;
            setTimeout(playNext, NOTE_DELAY * 1000);
        };
        
        playNext();
    }
    //#endregion

    //#region Status Light
    function updateStatusLights() {
        const pwr = document.getElementById('power-light');
        const ntf = document.getElementById('notification-light');
        const con = document.getElementById('connection-light');
        if (!pwr || !ntf || !con) return;

        // Power Light: Green when system is powered on, otherwise 'off'
        pwr.classList.toggle('on', state.poweredOn);
        pwr.classList.toggle('off', !state.poweredOn);

        // Notification Light: NanoChat (Blinking) takes precedence over News (Solid)
        ntf.classList.remove('on', 'blinking', 'off');
        if (state.hasUnreadNanoChat) {
            ntf.classList.add('blinking');
        } else if (state.hasUnreadNews) {
            ntf.classList.add('on');
        } else {
            ntf.classList.add('off');
        }

        // Connection Light: Request (Slow Blink) vs Message (Solid) vs off
        con.classList.remove('on', 'slow-blinking', 'off');
        if (state.pendingConnection) {
            con.classList.add('slow-blinking');
        } else if (state.hasUnreadTerminal) {
            con.classList.add('on');
        } else {
            con.classList.add('off');
        }
    }
    //#endregion
    
    //#region Circuit Validation
    function checkCircuitState() {
        if (state.adminOverride) {
            Object.keys(state.unlockedFeatures).forEach(k => state.unlockedFeatures[k] = true);
            renderPrograms();
            return;
        }

        const isRepaired = (slotId, correctOhms) => {
            const slot = document.getElementById(slotId);
            if (slot && slot.children.length > 0) {
                return slot.children[0].dataset.ohms === correctOhms;
            }
            return false;
        };

        if (state.poweredOn) markPuzzleComplete('fix_power');

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

        // Ensure power state matches the board: if the power resistor is missing, power must be off
        const r1Ok = isRepaired('slot-r1', '220');
        if (!r1Ok && state.poweredOn) {
            state.poweredOn = false;
            const pdaScreen = document.querySelector('.PDA-screen');
            const powerOverlay = document.getElementById('powerOverlay');
            const powerBtnEl = document.getElementById('powerOn');
            if (pdaScreen) pdaScreen.classList.add('screen-off');
            if (powerOverlay) powerOverlay.classList.remove('hidden');
            if (powerBtnEl) {
                powerBtnEl.disabled = true;
                powerBtnEl.textContent = "System Error";
                powerBtnEl.style.backgroundColor = "#555";
                powerBtnEl.style.cursor = "not-allowed";
            }
        }

        saveGameProgress();
    }
    //#endregion
    
    //#region Hash Modal
    function setupHashModal() {
        const pdaScreen = document.querySelector('.PDA-screen');
        if (!pdaScreen) return;
        
        // Bind Global Variables
        osCopyModal = document.getElementById('osCopyModal');
        osModalDisplay = document.getElementById('osModalDisplay');
        osPasteInput = document.getElementById('osPasteInput');
        pasteFeedback = document.getElementById('pasteFeedback');
        applyOsBtn = document.getElementById('applyOsBtn');
    
        // Bind Events Locally
        document.getElementById('closeOsModal')?.addEventListener('click', () => {
            osCopyModal.classList.add('hidden');
            if(pasteFeedback) pasteFeedback.textContent = ''; 
        });
    
        document.getElementById('copyOsBtn')?.addEventListener('click', () => {
            copyToClipboard(getTransferToken());
            const btn = document.getElementById('copyOsBtn');
            const originalText = btn.textContent;
            btn.textContent = "Copied Data!";
            setTimeout(() => btn.textContent = originalText, 1500);
        });
    
        applyOsBtn?.addEventListener('click', () => {
            const pastedHash = osPasteInput.value.trim();
            pasteFeedback.textContent = ''; 
            
            if (pastedHash === '') {
                pasteFeedback.textContent = "Error: Hash field cannot be empty.";
                return;
            }
    
            if (applyNewHash(pastedHash)) {
            } else {
                pasteFeedback.textContent = "Error: Invalid hash format detected.";
            }
        });
    }
        //#endregion

    document.addEventListener('DOMContentLoaded', async () => {
        await loadBookMarkup('book-injection-point', './Book/book.html');
        await loadCircuitMarkup('circuit-injection-point', './Circuit/circuit.html');
        
        pda = el('pda');
        views = {
            home: el('view-home'),
            programs: el('view-programs'),
            settings: el('view-settings'),
            program: el('view-program'),
            files: el('view-files')
        };
        tabs = document.querySelectorAll('.nav-btn');
        programGrid = el('programGrid');
        btnEject = el('btn-eject');
        btnStylus = el('btn-stylus');
        btnFull = el('btn-full');
        btnPower = el('btn-power');
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
        backPanel = document.querySelector('.pda-back-panel'); 
        newsModule = createNewsModule(state, el, showView, ringtoneModal);
        secretHandler = createSecretHandler(state, el, showView, ringtoneModal);
        musicModule = createMusicModule(state, el, showView, ringtoneModal);

        nanoChatTriggers = createNanoChatTriggers(secretHandler, musicModule, showView, renderPrograms);
       
        restoreGameProgress();
        // Ensure UI status lights reflect the loaded state
        updateStatusLights();
        renderPrograms();
        showView('home');
        setInterval(updateHome, 1000);
        updateHome();
        setupHashModal();
        randomizeResistorsInDrawer();

        const pdaContainer = el('pda');
        const flipTriggerBtn = el('btn-flip-trigger');
        const flipBackBtn = el('btn-flip-back');       
        
        osCopyModal = el('osCopyModal');
        osModalDisplay = el('osModalDisplay');
        osPasteInput = el('osPasteInput');
        pasteFeedback = el('pasteFeedback');
        applyOsBtn = el('applyOsBtn');

        
        el('closeOsModal')?.addEventListener('click', () => osCopyModal.classList.add('hidden'));
        
        applyOsBtn?.addEventListener('click', () => {
            const pastedHash = osPasteInput.value.trim();
            pasteFeedback.textContent = '';
            
            if (pastedHash === '') {
                pasteFeedback.textContent = "Error: Hash field cannot be empty.";
                return;
            }

            if (applyNewHash(pastedHash)) {
            } else {
                pasteFeedback.textContent = "Error: Invalid hash format detected.";
            }
        });

        //#region --- System Status Page ---
        const systemStatusRow = el('systemStatusRow');
        const settingsList = el('settingsList');
        const systemStatusView = el('systemStatusView');
        const backToSettingsBtn = el('backToSettingsBtn');
        const filesBackBtn = document.getElementById('btn-status-back');

        if (filesBackBtn) {
            filesBackBtn.addEventListener('click', () => {
                renderSystemStatus();
                showView('settings');
                if (settingsList) settingsList.classList.add('hidden');
                if (systemStatusView) systemStatusView.classList.remove('hidden');
            });
        }

        if (systemStatusRow) {
            systemStatusRow.addEventListener('click', () => {
                renderSystemStatus(); 
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

        if (tabs && tabs.length) {
            tabs.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.dataset.tab === 'settings') {
                        if(settingsList) settingsList.classList.remove('hidden');
                        if(systemStatusView) systemStatusView.classList.add('hidden');
                    }
                });
            });
        }
        //#endregion

        //#region --- IDENTITY LOGIC ---
        const identityModal = el('identityModal');
        const identityInput = el('identityInput');
        const identitySubmitBtn = el('identitySubmitBtn');
        const btnAdminId = el('btn-admin-id'); 

        const updateIdentity = (name) => {
            if (!name) return;
            state.id = name;
            localStorage.setItem('pda_user_identity', name);
            updateHome(); 
            if (identityModal) {
                identityModal.classList.add('hidden');
                identityModal.style.display = 'none'; 
            }
            state.terminalHistory.push({ 
                text: `Identity verified. Welcome, ${name}.`,
                type: "system" 
            });
        };

        const savedIdentity = localStorage.getItem('pda_user_identity');
        
        if (savedIdentity) {
            updateIdentity(savedIdentity);
        } else {
            if (identityModal) {
                identityModal.classList.remove('hidden');
                if(identityInput) identityInput.focus();
            }
        }

        if (identitySubmitBtn && identityInput) {
            identitySubmitBtn.addEventListener('click', () => {
                const val = identityInput.value.trim();
                if (val.length > 0) {
                    updateIdentity(val);
                }
            });

            identityInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') identitySubmitBtn.click();
            });
        }
        //#endregion

        if (btnAdminId) {
            btnAdminId.addEventListener('click', () => {
                if (identityModal) {
                    identityModal.classList.remove('hidden');
                    identityModal.style.display = ''; 
                    
                    if(identityInput) {
                        identityInput.value = state.id; 
                        identityInput.focus();
                    }
                }
            });
        }
        
        const btnAdminReset = el('btn-admin-reset');
        if (btnAdminReset) {
            btnAdminReset.addEventListener('click', () => {
                resetGameProgress();
            });
        }

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

        /* --- GLOBAL MOUSE TRACKING --- */
        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (state.stylus) requestAnimationFrame(updateStylusPosition);
        });

        function updateStylusPosition() {
            const stylusProp = document.getElementById('stylusProp');
            if (stylusProp && state.stylus) {
                stylusProp.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) rotate(15deg)`;
            }
        }

        /* --- UPDATE STYLUS BUTTON LISTENER --- */
        if (btnStylus) {
            btnStylus.addEventListener('click', () => {
                state.stylus = !state.stylus;
                
                // UI Updates
                btnStylus.setAttribute('aria-pressed', String(state.stylus));
                document.body.classList.toggle('stylus-active', state.stylus);
                
                const stylusProp = document.getElementById('stylusProp');
                const pdaFront = document.querySelector('.pda-front'); // The original container
                
                if (stylusProp && pdaFront) {
                    if (state.stylus) {
                        // --- ACTIVATE ---
                        // 1. Move element to BODY to escape PDA transforms
                        document.body.appendChild(stylusProp);
                        
                        // 2. Add classes for visual state
                        stylusProp.classList.add('tracking');
                        stylusProp.classList.add('ejected');
                        
                        // 3. Sync position immediately
                        updateStylusPosition();
                        
                        // Audio
                        const audio = new Audio('/Audio/click_fast.ogg');
                        audio.volume = 0.5;
                        audio.play().catch(()=>{}); 
                        
                    } else {
                        // --- DEACTIVATE ---
                        state.stylus = false;
                        document.body.classList.remove('stylus-active');
                        
                        if (stylusProp && pdaFront) {
                            stylusProp.classList.remove('tracking');
                            stylusProp.classList.remove('ejected');
                            stylusProp.style.transform = ''; 
                            pdaFront.prepend(stylusProp); 
                        }
                    }
                }
            });
        }

        document.addEventListener('dragstart', (e) => {
            if (state.stylus) {
                e.preventDefault();
                return false;
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (state.stylus && e.button === 0) {
                const stylusProp = document.getElementById('stylusProp');
                if (stylusProp) {
                    stylusProp.classList.add('lighting');
                    document.body.classList.add('light-on');
                }
                if (e.target.closest('.book-widget')) {
                    e.preventDefault();
                }
                // Audio
                const audio = new Audio('/Audio/shutter.ogg');
                audio.volume = 0.2;
                audio.play().catch(()=>{});
            }
        }, true);


        document.addEventListener('mouseup', () => {
            const stylusProp = document.getElementById('stylusProp');
            if (stylusProp) {
                stylusProp.classList.remove('lighting');
            }
            document.body.classList.remove('light-on');
        });

        // Ensure context menu cancellation puts it back correctly
        document.addEventListener('contextmenu', (e) => {
            if (state.stylus) {
                e.preventDefault(); 
                state.stylus = false;
                
                if (btnStylus) btnStylus.setAttribute('aria-pressed', 'false');
                document.body.classList.remove('stylus-active');
                
                const stylusProp = document.getElementById('stylusProp');
                const pdaFront = document.querySelector('.pda-front');
                
                if (stylusProp && pdaFront) {
                    stylusProp.classList.remove('tracking');
                    stylusProp.classList.remove('ejected');
                    stylusProp.style.transform = '';
                    pdaFront.prepend(stylusProp);
                }
                document.body.classList.remove('light-on');
                if (stylusProp) stylusProp.classList.remove('lighting');
            }
        });

        /* --- FULLSCREEN BUTTON --- */
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
            // Toggle the state boolean
            state.poweredOn = !state.poweredOn;

            console.log(`ADMIN: Power ${state.poweredOn ? 'ON' : 'OFF'}`);

            if (state.poweredOn) {
                // --- POWER ON LOGIC ---
                if (powerOn) {
                    powerOn.disabled = false;
                    powerOn.textContent = "Power On";
                    powerOn.style.backgroundColor = ""; 
                    powerOn.style.cursor = "pointer";
                }
                if (powerOverlay) powerOverlay.classList.add('hidden');
                if (pdaScreen) pdaScreen.classList.remove('screen-off');
                
                btnAdminPower.style.boxShadow = "0 0 15px #00ff00"; // Green glow for ON
            } else {
                // --- POWER OFF LOGIC ---
                if (powerOn) {
                    // If you want the physical "Power On" button to become 
                    // unusable when forced off by Admin, keep these:
                    powerOn.disabled = true;
                    powerOn.textContent = "Offline";
                    powerOn.style.backgroundColor = "#333";
                    powerOn.style.cursor = "not-allowed";
                }
                if (powerOverlay) powerOverlay.classList.remove('hidden');
                if (pdaScreen) pdaScreen.classList.add('screen-off');
                
                btnAdminPower.style.boxShadow = "none"; // Remove glow for OFF
            }

            // Update status lights after admin toggle
            updateStatusLights();
        });
    }
        
        const adminUnlockBtn = el('btn-admin-unlock-all'); 
        if (adminUnlockBtn) {
            adminUnlockBtn.addEventListener('click', () => {
                console.log("ADMIN: Toggling Unlock All");
                state.adminOverride = !state.adminOverride; 
    
                if (state.adminOverride) {
                    adminUnlockBtn.style.color = "#0f0";
                    adminUnlockBtn.style.borderColor = "#0f0";
                    adminUnlockBtn.style.boxShadow = "0 0 10px #0f0"; 
                } else {
                    adminUnlockBtn.style.color = "";
                    adminUnlockBtn.style.borderColor = "";
                    adminUnlockBtn.style.boxShadow = "";
                }
    
                checkCircuitState(); 
            });
        }
    
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
            saveGameProgress();
            updateStatusLights();
        };
    
        const turnOnScreen = () => {
            if(powerOverlay) powerOverlay.classList.add('hidden');
            if(pdaScreen) pdaScreen.classList.remove('screen-off');
            state.poweredOn = true;
            saveGameProgress();
            updateStatusLights();
        };

        if(!state.poweredOn) {
            turnOffScreen();
        }

        if (btnPower) {
            btnPower.addEventListener('click', () => {
                turnOffScreen();
            });
        }

        if (btnEject) {
            btnEject.addEventListener('click', () => {
                if (identityModal) {
                    identityModal.classList.remove('hidden');
                    identityModal.style.display = ''; 
                    
                    if(identityInput) {
                        identityInput.value = state.id; 
                        identityInput.focus();
                    }
                }
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

        const stationEl = el('station');
        if (stationEl) {
            // Initialize the text content immediately
            stationEl.textContent = state.station; 
            
            stationGlitch = new GlitchController(stationEl);
            
            // Only start glitching if we haven't solved the puzzle yet
            if (!state.puzzles.has('fix_station_glitch')) {
                stationGlitch.start();
            }
        }
    
        initializeBookSystem(el);
        initializeShineEffect();
        initializeDraggableItems();
    
        (function() {
            const drawerButtons = document.querySelectorAll('.drawer-button.top-right-drawer');
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
    
    //#region --- CIRCUIT REPAIR LOGIC ---
    function initializeDraggableItems() {
        const items = document.querySelectorAll('.drawer-item');
        const drawerZone = document.getElementById('drawerDropZone');
        const drawerPanel = document.querySelector('.top-right-drawer-panel');
        const screws = document.querySelectorAll('.screw');
        const resistorSlots = document.querySelectorAll('.resistor-slot');
        const powerBtn = document.getElementById('powerOn');
        
        if (backPanel) {
            backPanel.addEventListener('click', () => {
                if (backPanel.classList.contains('detached')) {
                    backPanel.classList.remove('detached');
                    setTimeout(() => {
                        if (pda) pda.classList.remove('flipped');
                    }, 600);
                } 
                else if (backPanel.classList.contains('unlocked')) {
                    backPanel.classList.add('detached');
                }
            });
        }
        
        if(!state.poweredOn) {
                if(pda) pda.classList.add('powered-off');
                if(powerOverlay) powerOverlay.classList.remove('hidden');
                if(powerBtn) {
                    powerBtn.disabled = true;
                    powerBtn.textContent = "System Error";
                    powerBtn.style.backgroundColor = "#555";
                    powerBtn.style.cursor = "not-allowed";
                }
        }

        const checkTerminalReady = (ignoredItem = null) => {
            const slot4 = document.getElementById('slot-r4');
            const slot5 = document.getElementById('slot-r5');
            
            const isValid = (slot) => {
                if (!slot || slot.children.length === 0) return false;
                const r = slot.children[0];
                if (r === ignoredItem) return false; 
                
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
                            renderPrograms(); 
                        }

                        // If the power resistor is being removed, ensure the PDA actually powers off
                        if (item.parentElement.id === 'slot-r1') {
                            // Prefer the shared helper if available
                            if (typeof turnOffScreen === 'function') {
                                turnOffScreen();
                            } else {
                                // Fallback: update UI/state directly
                                if (powerBtn) {
                                    powerBtn.textContent = "System Error";
                                    powerBtn.style.backgroundColor = "#555";
                                    powerBtn.disabled = true;
                                    powerBtn.style.cursor = "not-allowed";
                                }
                                const pdaScreen = document.querySelector('.PDA-screen');
                                const powerOverlay = document.getElementById('powerOverlay');
                                if (pdaScreen) pdaScreen.classList.add('screen-off');
                                if (powerOverlay) powerOverlay.classList.remove('hidden');
                                state.poweredOn = false;
                                saveGameProgress();
                            }
                        }
                    }
                    if (item.parentElement && item.parentElement.classList.contains('resistor-slot')) {
                        item.parentElement.style.boxShadow = "";
                    }

                    document.querySelectorAll('.pcb-overlay').forEach(ov => ov.classList.remove('active'));
                    
                    if (powerBtn) {
                        powerBtn.textContent = "System Error";
                        powerBtn.style.backgroundColor = "#555";
                        powerBtn.disabled = true;
                        powerBtn.style.cursor = "not-allowed";
                    }

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
                                    markPuzzleComplete('fix_power'); 
                                }
                                
                                checkCircuitState(); 
                            }
                        }
                    });

                    setTimeout(() => {
                        checkCircuitState();
                        saveGameProgress(); 
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

                    // 1. Logic for Screwdriver Interaction with Screws
                    if (item.classList.contains('screwdriver-prop')) {
                        // Find the actual tip element inside the screwdriver
                        const tip = item.querySelector('.tip');
                        
                        screws.forEach(screw => {
                            // Use the tip's position for the overlap check instead of the whole item
                            if (!screw.classList.contains('removed') && isOverlapping(tip, screw)) {
                                screw.classList.add('removed');
                                const a = new Audio('/Audio/click_fast.ogg'); 
                                a.play();
                                checkPanelStatus();
                            }
                        });
                    }

                    // 2. Logic for Resistor Interaction with Circuit Slots
                    if (item.classList.contains('resistor-prop')) {
                        const allSlots = document.querySelectorAll('.resistor-slot');
                        let placedSuccessfully = false;

                        allSlots.forEach(slot => {
                            if (slot.children.length > 0) return;

                            if (backPanel && backPanel.classList.contains('detached') && isOverlapping(item, slot)) {
                                // Reset styles to fit into the slot
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
                                        repairPDA();
                                    }
                                    checkCircuitState(); 
                                }
                                saveGameProgress(); 
                            }
                        });

                        if (placedSuccessfully) return;
                    }

                    // 3. Logic for returning items to the Drawer (Split Layout)
                    const drawerRect = drawerPanel.getBoundingClientRect();
                    const isOverDrawer = (
                        upEvent.clientX >= drawerRect.left &&
                        upEvent.clientX <= drawerRect.right &&
                        upEvent.clientY >= drawerRect.top &&
                        upEvent.clientY <= drawerRect.bottom
                    );

                    if (isOverDrawer && drawerPanel.classList.contains('open')) {
                        // Reset the item's appearance
                        item.classList.remove('floating');
                        item.classList.remove('placed'); // Ensure 'placed' is removed if coming from circuit
                        // item.style.position = ''; 
                        // item.style.left = '';
                        // item.style.top = '';
                        item.style.width = '';
                        item.style.height = '';
                        // item.style.transform = ''; 
                        
                        // Ensure specific placement based on item type
                        if (item.classList.contains('resistor-prop')) {
                            // Put resistors in the top section
                            const resistorZone = document.querySelector('.resistor-kit');
                            if (resistorZone) {
                                // 1. Set to absolute to break out of any layout flow
                                item.style.position = 'absolute';

                                // 2. Generate random position (keep away from edges to avoid clipping)
                                // Using percentages (10% to 80%) so it scales with drawer size
                                const randomX = Math.floor(Math.random() * 70) + 10; 
                                const randomY = Math.floor(Math.random() * 60) + 10;
                                const randomRotation = Math.floor(Math.random() * 360);

                                item.style.left = `${randomX}%`;
                                item.style.top = `${randomY}%`;
                                item.style.transform = `rotate(${randomRotation}deg)`;

                                resistorZone.appendChild(item);
                            }
                        }
                        if (item.classList.contains('screwdriver-prop')) {
                            const toolZone = document.querySelector('.drawer-inner-screwdriver-section');
                            if (toolZone) {
                                // Clear drag styles to allow CSS to take over again
                                item.classList.remove('floating');
                                item.style.position = '';
                                item.style.top = '';
                                item.style.left = '';
                                item.style.width = '';
                                item.style.height = '';
                                
                                toolZone.appendChild(item);
                            }
                        }
                    }
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });

        // This logic connects the buttons to the CSS transitions
        if (panUpBtn && panDownBtn && cubeWrapper) {
            // Button on the Main Face: Rotate DOWN to show the second page
            panUpBtn.addEventListener('click', () => {
                cubeWrapper.classList.add('pan-up');
                cubeWrapper.classList.add('is-panning');
            });

            // Button on the Second Page: Rotate back UP to the main face
            panDownBtn.addEventListener('click', () => {
                cubeWrapper.classList.remove('pan-up');
                cubeWrapper.classList.add('is-panning');
            });
            cubeWrapper.addEventListener('transitionend', (e) => {
                // Only trigger if the transform transition finished on the wrapper itself
                if (e.target === cubeWrapper && e.propertyName === 'transform') {
                    cubeWrapper.classList.remove('is-panning');
                }
            });
        }
    }
    //#endregion
})();
