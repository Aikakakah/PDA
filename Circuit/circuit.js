// mechanics.js

// 1. The Single Source of Truth
// We map the HTML ID of the slot -> The Ohm value required -> The visual effects to trigger
export const RESISTOR_CONFIG = [
    {
        slotId: 'slot-r1',      // You will update HTML to match this
        requiredOhms: '220',     // The value defined on the resistor div
        effects: ['overlay-battery'], //,'overlay-traces'
        action: 'repair'         // Triggers the system repair (Power On)
    },
    {
        slotId: 'slot-r2',
        requiredOhms: '100',
        effects: ['overlay-communication'],
        action: 'standard',
        feature: 'nanochat'
    },
    {
        slotId: 'slot-r3',
        requiredOhms: '10k',
        effects: ['overlay-notekeeper'],
        action: 'standard'
    },
    {
        slotId: 'slot-r4',
        requiredOhms: '220',
        effects: ['overlay-terminal'],
        action: 'standard'
    },
    {
        slotId: 'slot-r5',
        requiredOhms: '10k',
        effects: ['overlay-terminal'],
        action: 'standard'
    },
    {
        slotId: 'slot-r6',
        requiredOhms: '10',
        effects: ['overlay-speakers'],
        action: 'standard'
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