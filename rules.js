// rules.js
export const RULES_CONTENT = [
    {
        category: "General Conduct",
        alwaysExpanded: true,
        items: [
            { 
                text: "Welcome to hell! Haha well not really, but good luck. This project has been a labor of love for a long time and I hope you find it enjoyable.<br><br> Below are some general rules, guidelines, and resources you should follow while working through the puzzles.", 
                bullet: false,
                image: "Images/Rules/ID-Card.png"
            },
            { text: "Feel free to use the links and resources listed thoughout the guide, but don't explore those websites beyond the linked sources.", bullet: true },
            { text: "Some puzzles may require you to utilize google for outside information, but try to keep your searches targeted. Generally you will know when you will need to search something.", bullet: true },
            { 
                text: "If you get stuck on anything, feel free to contact NU-J5P4 via the terminal.", 
                bullet: true
            }
        ]
    },
    {
        category: "Technical Safety",
        alwaysExpanded: false,
        items: [
            { text: "Do not remove the back panel screws unless the device is powered off.", bullet: true },
            { text: "Handle resistors with care; static discharge can corrupt the kernel.", bullet: true },
            { text: "The stylus is not a tool for prying open the drawer.", bullet: true }
        ]
    },
    {
        category: "Cipher Types",
        alwaysExpanded: false,
        isSub: false,
        items: [
            { 
                text: "As a rule of thumb, ciphers can be broken down into two main categories: substitution ciphers and transposition ciphers. Substitution ciphers can be broken down further into monoalphabetic and polyalphabetic substitution.<br>", 
                bullet: false,
            },
        ]
    },
    {
        category: "Substitution",
        alwaysExpanded: false,
        isSub: true,
        parentCategory: "Cipher Types",
        items: [
            { 
                text: "Substitution ciphers are generally the easiest ciphers. Monoalphabetic ciphers are the easiest and can be brute forced without much effort beyond recognizing patterns in English.<br>", 
                bullet: false,
            },
            
        ]
    },
    {
        category: "Monoalphabetic",
        isSub: true,
        parentCategory: "Substitution",
        items: [
            { 
                text: "Monoalphabetic is the easiest and most common cipher type for beginners. An example is a basic Caesar/shift cipher where the alphabet remains the same but shifted. Some of them you can solve by simply shifting the alphabet, or they just follow an easy rule, like reversing the alphabet.<br><br> Others might not follow rules like that. A good example would be a cryptogram. Every letter has a substitute. Even for monoalphabetic ciphers that have rules such as shifting or reversing, you can solve via brute force.", 
                bullet: false
            },
            { 
                text: "To solve monoalphabetic ciphers with brute force, you will need to recognize patterns that are common in English (assuming the cipher is in English). So if you see a letter isolated between spaces, you have to assume it will be A or I.", 
                bullet: true
            },
            { 
                text: "Continuing from this, you could use <a href='https://www.dcode.fr/frequency-analysis' target='_blank' rel='noopener noreferrer' style='color: #0f0;'>frequency analysis</a>. E is the most common letter in English, so if you have a cipher text and the most common letter is X, then you can assume it's E.", 
                bullet: true
            },
            {
                text: "<a href='https://rumkin.com/tools/cipher/cryptogram/' target='_blank' rel='noopener noreferrer' style='color: #0f0; text-decoration: underline;'>Manual Substitution Cipher Solver</a>",
                bullet: true,
            },
        ]
    },
    {
        category: "Polyalphabetic X",
        isSub: true,
        parentCategory: "Substitution", // Links it to the parent subgroup
        items: [
            { 
                text: "A polyalphabetic cipher is a bit more complex. Essentially, it has multiple alphabets in use compared to just one. My favorite among these is the Vignere cipher. The Vignere cipher uses a key. So lets say my key is SCUBA (and yes, it is very possible to determine the key solely from brute force, but I don't expect that from you).", 
                bullet: false }
        ]
    },
    {
        category: "Transposition",
        alwaysExpanded: false,
        isSub: true,
        parentCategory: "Cipher Types",
        items: [
            { 
                text: "Transposition is the other type of cipher, and they can be really fun since they follow patterns. For example, the easiest one would be the railfence cipher. Their key is always a number, but if not given one, sometimes you just gotta start from a key of 2 and work up if you can't recognize anything from the cipher text. The key in this case determines how many rows are used.", 
                bullet: false,
                // image: "Images/Rules/ID-Card.png" GET RAILFENCE EXAMPLE
            },
            { 
                text: "This is the first half of a railfence I did ages ago. Even without knowing the missing letters, you can still infer some words, such as \"PoWeRiNg oN\" which will help you out when trying to determine where the other letters are in the text.", 
                bullet: false,
            },
            { 
                text: "In short, transposition ciphers don't change the letters like a subsitution cipher does, instead they will shift/move them around.", 
                bullet: true,
            }
        ]
    },
    {
        category: "Cipher Resources",
        alwaysExpanded: false,
        isSub: false,
        items: [
            { 
                text: "Always wear your assigned ID card while on duty. Refer to the diagram below for proper placement.", 
                bullet: true,
                image: "Images/Rules/ID-Card.png"
            },
            { text: "Do not enter the maintenance tunnels without a supervisor.", bullet: true },
            { 
                text: "Report any 'glitching' of the PDA system immediately.", 
                bullet: true
            }
        ]
    },
    {
        category: "Frequency Analysis",
        isSub: true,
        parentCategory: "Cipher Resources", // Links it to the parent subgroup
        items: [
            { 
                text: "Frequency analysis is a technique used to break substitution ciphers by studying the frequency of letters or groups of letters in a ciphertext. Almost all simple subsitution ciphers can be solved by applying this method alone. However, more complex ciphers, like polyalphabetic or modern ciphers (Vigenère, stream ciphers, block ciphers), resist simple frequency analysis because they change letter mappings.", 
                bullet: false,
                image: "Images/Rules/Frequency Chart.png",
            },
            {
                text: "Even substitution ciphers using glyphs or symbols can be solved with frequency analysis. In these cases, you might want to try replacing symbols with random english letters to make solving easier.",
                bullet: true,
            },
            {
                text: "Useful Links",
                bullet: false,
            },
            {
                text: "<a href='https://en.wikipedia.org/wiki/Letter_frequency' target='_blank' rel='noopener noreferrer' style='color: #0f0; text-decoration: underline;'>Wikipedia: Letter Frequency</a>",
                bullet: true,
            },
            {
                text: "<a href='https://charactercounter.com/letter-frequency-counter' target='_blank' rel='noopener noreferrer' style='color: #0f0; text-decoration: underline;'>Letter Frequency Counter</a>",
                bullet: true,
            },
            {
                text: "<a href='https://rumkin.com/tools/cipher/analyze/' target='_blank' rel='noopener noreferrer' style='color: #0f0; text-decoration: underline;'>Letter Frequency Analyzer</a>",
                bullet: true,
            }
        ]
    },
    {
        category: "Friedman index of coincidence",
        isSub: true,
        parentCategory: "Friedman index of coincidence",
        items: [
            { 
                text: "Frequency analysis is a technique used to break substitution ciphers by studying the frequency of letters or groups of letters in a ciphertext. Almost all simple subsitution ciphers can be solved by applying this method alone. However, more complex ciphers, like polyalphabetic or modern ciphers (Vigenère, stream ciphers, block ciphers), resist simple frequency analysis because they change letter mappings.", 
                bullet: false,
                image: "Images/Rules/Frequency Chart.png",
            },
            {
                text: "Even substitution ciphers using glyphs or symbols can be solved with frequency analysis. In these cases, you might want to try replacing symbols with random english letters to make solving easier.",
                bullet: true,
            },
            {
                text: "Useful Links",
                bullet: false,
            },
            {
                text: "<a href='https://en.wikipedia.org/wiki/Letter_frequency' target='_blank' rel='noopener noreferrer' style='color: #0f0; text-decoration: underline;'>Wikipedia: Letter Frequency</a>",
                bullet: true,
            },
            {
                text: `
                <table style="width:100%; border-collapse: collapse; margin-top: 10px; color: #0f0; border: 1px solid #0f0; font-size: 0.9em;">
                    <thead>
                        <tr style="border-bottom: 2px solid #0f0;">
                            <th style="padding: 5px; text-align: left; border: 1px solid #0f0;">Language</th>
                            <th style="padding: 5px; text-align: left; border: 1px solid #0f0;">Index of Coincidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style="padding: 4px; border: 1px solid #0f0;">English</td><td style="padding: 4px; border: 1px solid #0f0;">1.73</td></tr>
                        <tr><td style="padding: 4px; border: 1px solid #0f0;">French</td><td style="padding: 4px; border: 1px solid #0f0;">2.02</td></tr>
                        <tr><td style="padding: 4px; border: 1px solid #0f0;">German</td><td style="padding: 4px; border: 1px solid #0f0;">2.05</td></tr>
                        <tr><td style="padding: 4px; border: 1px solid #0f0;">Italian</td><td style="padding: 4px; border: 1px solid #0f0;">1.94</td></tr>
                        <tr><td style="padding: 4px; border: 1px solid #0f0;">Portuguese</td><td style="padding: 4px; border: 1px solid #0f0;">1.94</td></tr>
                        <tr><td style="padding: 4px; border: 1px solid #0f0;">Russian</td><td style="padding: 4px; border: 1px solid #0f0;">1.76</td></tr>
                        <tr><td style="padding: 4px; border: 1px solid #0f0;">Spanish</td><td style="padding: 4px; border: 1px solid #0f0;">1.94</td></tr>
                    </tbody>
                </table>`,
                bullet: false
            }
        ]
    },
    {
        category: "Useful Tools",
        alwaysExpanded: true,
        isSub: false,
        items: [
            {
                text: "<a href='https://charactercounter.com/letter-frequency-counter' target='_blank' rel='noopener noreferrer' style='color: #0f0; text-decoration: underline;'>Letter Frequency Counter</a>",
                bullet: true,
            },
            {
                text: "<a href='https://rumkin.com/tools/cipher/analyze/' target='_blank' rel='noopener noreferrer' style='color: #0f0; text-decoration: underline;'>Letter Frequency Analyzer</a>",
                bullet: true,
            },
            {
                text: "<a href='https://rumkin.com/tools/cipher/cryptogram/' target='_blank' rel='noopener noreferrer' style='color: #0f0; text-decoration: underline;'>Manual Substitution Cipher Solver</a>",
                bullet: true,
            },
        ]
    },
];


// Substitution ciphers are generally the easiest ciphers. They can be broken up into 2 categories. Monoalphabetic substitution and polyalphabetic substitution. 

// Monoalphabetic is the easiest and most common cipher type for beginners. An example is a basic Caesar/shift cipher where the alphabet remains the same but shifted. Some of them you can solve by simply shifting the alphabet, or they just follow an easy rule, like reversing the alphabet. 
// Others might not follow rules like that. A good example would be a cryptogram. Every letter has a substitute. Even for mono ciphers that have rules, you can solve via brute force.