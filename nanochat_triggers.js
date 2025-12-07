/**
 * @module NanoChatTriggers
 * Handles special interactions and events in NanoChat, such as playing audio
 * when specific messages are sent to specific contacts.
 */

// [CHANGE] Accepting secretHandler as an argument so we can unlock files
export function createNanoChatTriggers(secretHandler) {
    /**
     * Checks if a message should trigger any special actions.
     * @param {string} contactName - The name of the contact the message is being sent to
     * @param {string} messageText - The text of the message being sent
     */
    function checkAndTrigger(contactName, messageText) {
        // Check for Pallas + Stardust trigger
        if (contactName === "Pallas" && messageText.includes("Stardust")) {
            // 1. Play the immediate audio effect
            playStardustAudio();

            // 2. Unlock the file in the Secret/Files Viewer
            if (secretHandler && typeof secretHandler.unlockStardust === 'function') {
                secretHandler.unlockStardust();
            }
        }
    }

    /**
     * Plays the Stardust.mp3 audio file.
     */
    function playStardustAudio() {
        const stardustAudio = new Audio('/Audio/Stardust.mp3');
        stardustAudio.play().catch(() => {
            // Silently handle playback errors
        });
    }

    // Public API
    return {
        checkAndTrigger: checkAndTrigger
    };
}