// rules.js
export const RULES_CONTENT = [
    {
        category: "General Conduct",
        alwaysExpanded: true,
        items: [
            { 
                text: "Always wear your assigned ID card while on duty. Refer to the diagram below for proper placement.", 
                bullet: false,
                image: "Images/Rules/ID-Card.png"
            },
            { text: "Do not enter the maintenance tunnels without a supervisor.", bullet: true },
            { text: "This may require you to utilize google for outside information, try to keep your searches targeted. Generally you will know when you will need to search something.", bullet: true },
            { 
                text: "Report any 'glitching' of the PDA system immediately.", 
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
        category: "Ciphers",
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
        category: "Substitution",
        alwaysExpanded: false,
        isSub: true,
        parentCategory: "Ciphers",
        items: [
            { 
                text: "Substitution ciphers are generally the easiest ciphers. They can be broken up into 2 categories. Monoalphabetic substitution and polyalphabetic substitution.", 
                bullet: false,
                // image: "Images/Rules/ID-Card.png"
            },
            { text: "Do not enter the maintenance tunnels without a supervisor.", bullet: true },
            { 
                text: "Report any 'glitching' of the PDA system immediately.", 
                bullet: true
            }
        ]
    },
    {
        category: "Monoalphabetic",
        isSub: true,
        parentCategory: "Substitution", // Links it to the parent subgroup
        items: [
            { text: "Example: Caesar Cipher", bullet: true }
        ]
    },
    {
        category: "Polyalphabetic",
        isSub: true,
        parentCategory: "Substitution", // Links it to the parent subgroup
        items: [
            { text: "Example: Caesar Cipher", bullet: true }
        ]
    },
    {
        category: "Transposition",
        alwaysExpanded: false,
        isSub: true,
        parentCategory: "Ciphers",
        items: [
            { 
                text: "Substitution ciphers are generally the easiest ciphers. They can be broken up into 2 categories. Monoalphabetic substitution and polyalphabetic substitution.", 
                bullet: false,
                // image: "Images/Rules/ID-Card.png"
            },
            { text: "Do not enter the maintenance tunnels without a supervisor.", bullet: true },
            { 
                text: "Report any 'glitching' of the PDA system immediately.", 
                bullet: true
            }
        ]
    },
];


// Substitution ciphers are generally the easiest ciphers. They can be broken up into 2 categories. Monoalphabetic substitution and polyalphabetic substitution. 

// Monoalphabetic is the easiest and most common cipher type for beginners. An example is a basic Caesar/shift cipher where the alphabet remains the same but shifted. Some of them you can solve by simply shifting the alphabet, or they just follow an easy rule, like reversing the alphabet. 
// Others might not follow rules like that. A good example would be a cryptogram. Every letter has a substitute. Even for mono ciphers that have rules, you can solve via brute force.