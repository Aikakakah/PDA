// terminal_bridge.js
// Handles communication between the PDA and the Local Node Server

export function createTerminalBridge(apiUrl, onMessageReceived) {
    let interval = null;
    let lastTimestamp = Date.now();
    let isPolling = false;

    // Internal polling function
    const poll = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/messages?since=${lastTimestamp}`);
            if (!response.ok) return; // Server might be down, ignore

            const data = await response.json();
            
            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                    // Update timestamp to avoid duplicates
                    if (msg.timestamp > lastTimestamp) {
                        lastTimestamp = msg.timestamp;
                    }
                    // Pass message back to the main script
                    onMessageReceived(msg);
                });
            }
        } catch (e) {
            // Silently fail if server is offline to not spam console
        }
    };

    return {
        // Start checking for messages
        start: () => {
            if (isPolling) return;
            isPolling = true;
            // Check every 2 seconds
            interval = setInterval(poll, 2000);
            console.log("Terminal Uplink Established.");
        },

        // Stop checking
        stop: () => {
            isPolling = false;
            clearInterval(interval);
            console.log("Terminal Uplink Severed.");
        },

        // Send a message to Discord
        send: async (text, senderName) => {
            try {
                await fetch(`${apiUrl}/api/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: text, 
                        sender: senderName 
                    })
                });
                return true;
            } catch (e) {
                console.error("Uplink Transmission Failed:", e);
                return false;
            }
        }
    };
}