// modal.js



/**
 * Generates the HTML for the OS Hash / System Interface modal.
 */
export function createOSModalMarkup() {
    return `
        <div class="modal hash-modal hidden" id="osCopyModal">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">System Hash Interface</div>
                    <button class="modal-close" id="closeOsModal">✕</button>
                </div>
                
                <p style="color:var(--text); font-size:0.9em; margin: 10px 0;">
                    Use this token to verify or transfer progress between systems.
                </p>
                
                <label style="color:var(--muted); font-size:0.8em; text-transform:uppercase;">Current Hash</label>
                <div id="osModalDisplay" class="hash-display">UNKNOWN</div>
                <div style="text-align:right; margin-bottom:15px; margin-top:5px;">
                     <button id="copyOsBtn" class="action-btn">Copy Hash</button>
                </div>
                
                <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
                
                <label style="color:var(--muted); font-size:0.8em; text-transform:uppercase;">Paste New Hash (Transfer)</label>
                <input type="text" id="osPasteInput" placeholder="Paste verification token here..." style="width:100%; box-sizing:border-box; padding:8px; margin-top:5px; background:var(--panel); border:1px solid #444; color:var(--text);">
                <p id="pasteFeedback" style="color: var(--danger); font-size: 0.8em; height: 1em; margin-top:5px;"></p>
        
                <div class="modal-actions">
                    <button class="action-btn danger-btn" id="applyOsBtn">Apply & Reboot</button>
                </div>
            </div>
        </div>
    `;
}





/**
 * Generates the HTML for the Ringtone configuration modal.
 */
export function createRingtoneModalMarkup(currentRingtone) {
    const safeRingtone = currentRingtone || ["", "", "", "", "", ""];
    
    // We create input placeholders. Values are updated via JS on open to ensure sync.
    const inputHtml = safeRingtone.map((note, index) =>
        `<input type="text" maxlength="2" data-note-index="${index}" class="ringtone-note-input" value="${note}">`
    ).join('');

    return `
        <div class="modal ringtone-modal hidden" id="ringtoneModal">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Ringtone</div>
                    <button class="modal-close" id="closeRingtoneModal">✕</button>
                </div>
                <p style="color:var(--muted); font-size:0.9em; margin-bottom:15px; text-align:center;">Enter a 6-note sequence.</p>
                <div class="ringtone-inputs-wrap" id="ringtoneDisplay">${inputHtml}</div>
                <div class="modal-actions">
                    <button id="testRingtoneBtn" class="action-btn">Test</button>
                    <button id="setRingtoneBtn" class="action-btn confirm">Set</button>
                </div>
            </div>
        </div>
    `;
}

/* --- Embedded Modals --- */

/* --- NANOCHAT --- */

export function createNanoChatNewContactModal() {
    return `
        <div class="modal nanochat-modal hidden" id="newChatModal">
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
}


/* --- Popup Modals --- */

/* --- CHANGELOG --- */
export function createChangelogModalMarkup(systemVersion) {
    return `
        <div class="modal changelog-modal hidden" id="changelogModal">
            <div class="modal-content">
                <button class="modal-close" id="closeChangelogModal">✕</button>
                <div class="modal-header">
                    <div class="modal-title">System Patch Notes</div>
                </div>
                <div class="changelog-list" id="changelogList"></div>
            </div>
        </div>
    `;
}

/* --- ID CARD --- */
export function createIdentityModalMarkup() {
    return `
        <div class="modal identity-modal hidden" id="identityModal">
            <div class="modal-content identity-box">
                <div class="identity-background">
                    <button class="modal-close" id="closeIdentityModal" style="margin-left:auto;">✕</button>
                <div class="identity-content">
                    <p>Please enter your name below.</p>
                    <p1>Cookies are saved. If you don't want to save them, you can copy the code in the settings-status menu.</p1>
                    <input type="text" id="identityInput" placeholder="Enter Name / Callsign" maxlength="20" autocomplete="off">
                    <button id="identitySubmitBtn" title="Good luck!">INITIALIZE</button>
                </div>
            </div>
        </div>
    `;
}

// modal.js
export function createRulesModalMarkup() {
    return `
        <div id="rulesModal" class="modal-overlay hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>STATION RULES & REGS</h2>
                    <button id="closeRulesModal" class="modal-close">&times;</button>
                </div>
                <div id="rulesList" class="modal-body changelog-list">
                    </div>
            </div>
        </div>
    `;
}