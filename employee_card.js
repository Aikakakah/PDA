// Employee card renderer
// Predefined employees list. Add or extend entries here.
export const EMPLOYEES = [
    // Default classified placeholder entry
    {
        name: 'CLASSIFIED',
        nicknames: [],
        role: 'CLASSIFIED',
        department: 'CLASSIFIED',
        clearance: 'CLASSIFIED',
        height: '',
        eyecolor: '',
        features: '',
        notes: 'CLASSIFIED',
        image: 'Images/Employees/Classified.png',
    },
    {
        name: 'Ronin T. Pallas',
        nicknames: ['pallas', 'ronin'],
        role: 'Head of Research and Development',
        department: 'Science',
        clearance: 'Level 5',
        height: "6'3\"",
        eyecolor: "Blue",
        features: "Two scars on left eye, scar on left cheek.",
        notes: 'Inform of new subjects immediately.',
        image: 'Images/Employees/Pallas.png',
    },
    {
        name: 'Ramona Orthall',
        nicknames: [],
        role: '',
        department: 'Science',
        clearance: 'Level 4*',
        height: "5'4\"",
        eyecolor: 'Blue',
        features: 'Prosthetic arms, spinal implant, biosynthesized right eye.',
        notes: 'Clearance is only granted within her department. Assume level 0 clearance elsewhere. Highly dangerous.',
        image: 'Images/Employees/Ramona.png',
    },
    {
        name: 'Sandy Deathshed',
        nicknames: [],
        role: 'Head of Security',
        department: 'Security',
        clearance: 'Level 5',
        height: "5'10\"",
        eyecolor: 'Red',
        features: 'Moth person, tan fur, pink wings.',
        notes: 'Refer to Sandy for all security matters. Do not allow Dr. Pallas to bypass her authority.',
        image: 'Images/Employees/Sandy.png',
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
                    ${isDiscovered ? (`
                        <div><strong>Department:</strong> ${member.department || ''}</div>
                        <div><strong>Clearance:</strong> ${member.clearance || ''}</div>
                        <div><strong>Height:</strong> ${member.height || ''}</div>
                        <div><strong>Eye Color:</strong> ${member.eyecolor || ''}</div>
                        <div><strong>Defining Features:</strong> ${member.features || ''}</div>
                        <div><strong>Notes:</strong> ${member.notes || ''}</div>
                        `
                    ) : '<div class="muted">Contact restricted</div>'}
                </div>
                <div class="employee-actions">
                    <button class="employee-back-btn">
                    <i class="fas fa-arrow-left"></i>
                    </button>
                    
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
