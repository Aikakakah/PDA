/**
 * @module DialogueReveal
 * Unified handler and reference implementation for PDA Dialogue Reveal secrets.
 */

// --- 1. CORE DIALOGUE HANDLER ---

export function createDialogueRevealHandler(secretHandler) {
    /**
     * Handles dialogue population based on the secret key.
     * Called automatically when a dialogue secret is opened.
     * For sandychat, the dialogue is pre-rendered in HTML, so nothing needs to happen here.
     */
    function handleDialogueReveal(secretKey, character, message) {
        switch (secretKey) {
            case 'sandychat':
                // Sandychat dialogue is pre-rendered as static HTML in secrets.html
                // No dynamic population needed
                break;
            // Register additional secret keys here as needed
            default:
                console.warn(`No dialogue sequence defined for secretKey: ${secretKey}`);
                break;
        }
    }

    /**
     * Sequence for 'sandychat' secret.
     * NOTE: Sandychat is now pre-rendered as static HTML in secrets.html
     * This function is kept as reference for how to build dynamic dialogues
     */
    function populateSandychat(character, message) {
        // Static HTML approach - define dialogue directly in secrets.html instead
        // See secrets.html [data-secret="sandychat"] for the pre-built dialogue
    }

    return {
        handleDialogueReveal
    };
}

// --- 2. USAGE EXAMPLES & UTILITIES ---

/**
 * Example 1: Timed sequence builder for custom interactive events.
 */
export function exampleTimedDialogue(secretHandler, key = 'dialogue_reveal') {
    secretHandler.trigger(key);
    secretHandler.clearDialogueThread();

    const dialogues = [
        { 
            character: 'Sandy', 
            message: "Sandy's voice was sharp, almost accusatory.",
            position: 'right',
            image: '/Images/Employees/Sandy.png'
        },
        { 
            character: 'Dr. Jensen', 
            message: 'Dr. Jensen? Yes, her project went rogue on her.',
            position: 'left',
            image: '/Images/Employees/Pallas.png'
        },
        { 
            character: 'Pallas', 
            message: 'Pallas replied, his tone dismissive, as if it was just another minor inconvenience.',
            position: 'left',
            image: '/Images/Employees/Pallas.png'
        },
        { 
            character: 'Sandy', 
            message: "Aren't you worried? One wrong step and—",
            position: 'right',
            image: '/Images/Employees/Sandy.png'
        }
    ];

    dialogues.forEach((dialogue, index) => {
        setTimeout(() => {
            secretHandler.addDialogueMessage(
                // dialogue.character,
                dialogue.message,
                dialogue.position,
                dialogue.image
            );
        }, index * 1000);
    });
}

/**
 * Example 2: Immediate non-portrait fallback sequence.
 */
export function exampleFallbackDialogue(secretHandler) {
    secretHandler.trigger('dialogue_reveal');
    secretHandler.clearDialogueThread();

    secretHandler.addDialogueMessage(
        'Unknown Speaker',
        'This message has no portrait image provided.',
        'left' // Omitting portraitImageUrl defaults to [NO IMAGE]
    );
}