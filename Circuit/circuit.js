// mechanics.js

// 1. The Single Source of Truth
// We map the HTML ID of the slot -> The Ohm value required -> The visual effects to trigger
export const RESISTOR_CONFIG = [
    {
        slotId: 'slot-r1', //P1
        requiredOhms: '220',
        effects: ['overlay-battery'],
        action: 'repair'
    },
    {
        slotId: 'slot-r2',  //C9
        requiredOhms: '100',
        effects: ['overlay-communication'],
        action: 'standard',
        feature: 'nanochat'
    },
    {
        slotId: 'slot-r3',  //M1
        requiredOhms: '10k',
        effects: ['overlay-notekeeper'],
        action: 'standard',
        feature: 'notekeeper' // Linked to Notekeeper
    },
    {
        slotId: 'slot-r4',  //T7
        requiredOhms: '220',
        effects: ['overlay-terminal'],
        action: 'standard',
        feature: 'terminal'   // Linked to Terminal (Part 1)
    },
    {
        slotId: 'slot-r5',  //T4
        requiredOhms: '10k',
        effects: ['overlay-terminal'],
        action: 'standard',
        feature: 'terminal'   // Linked to Terminal (Part 2)
    },
    {
        slotId: 'slot-r6',  //F7
        requiredOhms: '10',
        effects: ['overlay-speakers'],
        action: 'standard',
        feature: 'news'       // Linked to Station News
    }
];

// 2. Helper to validate a drop
export function validateResistorDrop(draggedItem, dropTarget) {
    // Find the config for the slot we dropped onto
    const slotConfig = RESISTOR_CONFIG.find(c => c.slotId === dropTarget.id);

    if (!slotConfig) return { success: false };

    // Check if the dragged resistor matches the config requirement
    const itemOhms = draggedItem.dataset.ohms;
    
    if (itemOhms === slotConfig.requiredOhms) {
        return { 
            success: true, 
            effects: slotConfig.effects,
            action: slotConfig.action,
            feature: slotConfig.feature
        };
    }

    return { success: false, error: 'mismatch' };
}