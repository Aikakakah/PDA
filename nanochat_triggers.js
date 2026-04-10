/**
 * @module NanoChatTriggers
 * Handles special interactions and events in NanoChat, such as playing audio
 * when specific messages are sent to specific contacts.
 */

export function createNanoChatTriggers(secretHandler) {
    /**
     * Checks if a message should trigger any special actions.
     * @param {string} contactName - The name of the contact the message is being sent to
     * @param {string} messageText - The text of the message being sent
     */
    function checkAndTrigger(contactName, messageText) {
        if (contactName === "Ronin Pallas" && messageText.includes("Stardust")) {
            playStardustAudio();

            if (secretHandler && typeof secretHandler.unlockStardust === 'function') {
                secretHandler.unlockStardust();
            }
        }
        // Trigger 2: Pass ALL messages to secret_handler so it can catch "GARDEN"
        if (secretHandler && typeof secretHandler.checkNanoChatTrigger === 'function') {
            secretHandler.checkNanoChatTrigger(contactName, messageText);
        }
    }

    function playStardustAudio() {
        const stardustAudio = new Audio('/Audio/Stardust.mp3');
        stardustAudio.play().catch(() => {
        });
    }

    return {
        checkAndTrigger: checkAndTrigger
    };
}
