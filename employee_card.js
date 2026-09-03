// Employee card renderer
// Predefined employees list. Add or extend entries here.
export const EMPLOYEES = [
    // Default classified placeholder entry
    {
        name: 'CLASSIFIED',
        nicknames: [],
        job: 'CLASSIFIED',
        height: '',
        src: '',
        image: 'Images/Employees/Classified.png',
        rank: 'CLASSIFIED',
        role: 'CLASSIFIED',
        notes: 'CLASSIFIED'
    },
    {
        name: 'Ronin T. Pallas',
        nicknames: ['pallas', 'ronin'],
        job: 'Research Director',
        height: "6'3\"",
        src: './Audio/Stardust.mp3',
        image: 'Images/Employees/Pallas.png',
        rank: 'Command',
        role: 'Head of Research and Development',
        notes: 'Prefers secure comms.'
    },
    {
        name: 'Sam Nighteyes',
        nicknames: ['sam'],
        job: 'Blueshield Officer',
        height: "6'0\"",
        src: '',
        image: 'Images/Employees/sam_nighteyes.png',
        rank: 'Dignitary',
        role: 'Blueshield Officer',
        notes: ''
    }
];

// Resolve a crew member name from a nanochat identifier or display name
export function resolveCrewFromNanochat(identifier) {
    if (!identifier) return null;
    const norm = String(identifier).toLowerCase().replace(/[^a-z0-9]/g, '');

    // Search nicknames first
    for (const m of EMPLOYEES) {
        if (Array.isArray(m.nicknames)) {
            for (const nick of m.nicknames) {
                if (norm === String(nick).toLowerCase().replace(/[^a-z0-9]/g, '')) return m.name;
            }
        }
    }

    // Match against full name or last name
    for (const m of EMPLOYEES) {
        const full = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (full === norm) return m.name;
        const last = m.name.split(' ').slice(-1)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        if (norm === last) return m.name;
    }

    return null;
}

export function createEmployeeCard(member, isDiscovered = false, onBack = null) {
    const card = document.createElement('div');
    card.className = 'employee-card';

    const slug = member?.name ? member.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'classified';
    // Choose image source: prefer explicit member.image when discovered, otherwise classified placeholder
    const imgSrc = isDiscovered ? (member.image || `Images/Employees/${slug}.png`) : (member.image || 'Images/Employees/Classified.png');
    const imgAlt = isDiscovered ? (member.name || 'Employee') : 'Classified';

        // Build HTML: left half image, right half details
        card.innerHTML = `
            <div class="employee-photo">
                <img src="${imgSrc}" alt="${imgAlt}" onerror="this.src='Images/ID-Card.png'" />
            </div>
            <div class="employee-info">
                <h2 class="employee-name">${isDiscovered ? member.name : 'Classified'}</h2>
                <div class="employee-role">${isDiscovered ? (member.role || '') : ''}</div>
                <div class="employee-details">
                    ${isDiscovered ? (`<div><strong>Rank:</strong> ${member.rank || ''}</div><div><strong>Notes:</strong> ${member.notes || ''}</div>`) : '<div class="muted">Contact restricted</div>'}
                </div>
                <div class="employee-actions">
                    <button class="employee-back-btn">Back</button>
                </div>
            </div>
        `;

    // Wire the back button
    const backBtn = card.querySelector('.employee-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => {
        // Prefer explicit onBack handler (should return to manifest). Fallback to filesBackBtn.
        if (typeof onBack === 'function') {
            onBack();
            return;
        }
        const filesBackBtn = document.getElementById('btn-status-back');
        if (filesBackBtn) filesBackBtn.click();
    });

    return card;

}
