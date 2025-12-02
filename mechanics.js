// mechanics.js

// 1. The Single Source of Truth
// We map the HTML ID of the slot -> The Ohm value required -> The visual effects to trigger
export const RESISTOR_CONFIG = [
    {
        slotId: 'slot-r1',      // You will update HTML to match this
        requiredOhms: '100',     // The value defined on the resistor div
        effects: ['overlay-communication', 'overlay-terminal'],
        action: 'standard'       // Just shows overlays
    },
    {
        slotId: 'slot-r2',
        requiredOhms: '220',
        effects: ['overlay-battery', 'overlay-traces'],
        action: 'repair'         // Triggers the system repair (Power On)
    },
    {
        slotId: 'slot-r3',
        requiredOhms: '10k',
        effects: ['overlay-notekeeper', 'overlay-speakers'],
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
        
        // 1. Identify the main circuit container to place the overlays inside.
        // We assume the slot (dropTarget) is inside a container that holds the circuit board graphic.
        // '.pda-circuit-board' is a common class, or fall back to a higher parent.
        const circuitBoardContainer = dropTarget.closest('.pda-circuit-board') || dropTarget.parentElement.parentElement; 

        // 2. Create and activate the overlays for all defined effects in the config.
        slotConfig.effects.forEach(effectId => {
            let overlayElement = document.getElementById(effectId);
            
            // If the element doesn't exist, create it dynamically
            if (!overlayElement) {
                // Create the new <div> element
                overlayElement = document.createElement('div');
                overlayElement.id = effectId; 
                // Assign the base class (which holds positioning and opacity settings)
                overlayElement.classList.add('circuit-overlay'); 
                // Insert the new element into the main circuit container
                circuitBoardContainer.appendChild(overlayElement);
            }

            // Apply the 'active' class, which causes the element (and its linked SVG from style.css) to be visible.
            overlayElement.classList.add('active'); 
        });

        // The drop is successful, return the result for script.js to handle.
        return { 
            success: true, 
            effects: slotConfig.effects,
            action: slotConfig.action
        };
    }

    return { success: false, error: 'mismatch' };
}