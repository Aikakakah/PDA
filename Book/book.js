// Book/book.js
export function initializeBookSystem(el) {
    let pageFlipInstance = null;
    let bookPrev = el('bookPrev');
    let bookNext = el('bookNext');
    let pageNumberDisplay = el('pageNumber');
    
    // NEW: Maximize Elements
    let bookMaximizeBtn = el('bookMaximizeBtn');
    let bookWidget = document.querySelector('.book-widget'); // Use querySelector for safety
    let isMaximized = false;

    // --- PageFlip Logic ---
    const updatePageControls = (pageFlip) => {
        if (!pageFlip) return;
        const bounds = pageFlip.getBounds && pageFlip.getBounds();
        if (!bounds) return;

        try {
            if (bookPrev) bookPrev.disabled = !pageFlip.hasPrevPage();
            if (bookNext) bookNext.disabled = !pageFlip.hasNextPage();
        } catch {
            if (bookPrev) bookPrev.disabled = true;
            if (bookNext) bookNext.disabled = true;
        }

        const currentPageIndex = pageFlip.getCurrentPageIndex ? pageFlip.getCurrentPageIndex() : 0;
        const pageCount = pageFlip.getPageCount ? pageFlip.getPageCount() : 0;

        if (bookWidget) {
            if (currentPageIndex === 0) {
                bookWidget.classList.add('on-cover');
            } else {
                bookWidget.classList.remove('on-cover');
            }
        }
        
        if (pageNumberDisplay) {
            if (currentPageIndex === 0) {
                pageNumberDisplay.textContent = 'Cover';
            } else if (currentPageIndex === pageCount - 1) {
                pageNumberDisplay.textContent = 'Back Cover';
            } else {
                pageNumberDisplay.textContent = `Page ${currentPageIndex + 1} / ${pageCount}`;
            }
        }
    };

    const initializePageFlip = () => {
        const bookEl = el('book');
        if (!bookEl) return;
        
        const handleInteractionBlock = (e) => {
            if (document.body.classList.contains('stylus-active')) {
                if (e.target.closest('.book-note') || 
                    e.target.closest('.floating-note') || 
                    e.target.closest('button') ||
                    e.target.closest('input')) {
                    return; 
                }
                e.stopPropagation();
            }
        };

        bookEl.addEventListener('mousedown', handleInteractionBlock, true);
        bookEl.addEventListener('touchstart', handleInteractionBlock, true);

        const rootStyle = getComputedStyle(document.documentElement);
        const bookWidth = parseFloat(rootStyle.getPropertyValue('--book-width'));
        const bookHeight = parseFloat(rootStyle.getPropertyValue('--book-height'));
        const singlePageW = bookWidth / 2;
        const singlePageH = bookHeight;

        let pageFlip = null;

        // Check for St.PageFlip (Assumed loaded via CDN in index.html)
        if (typeof St === 'undefined' || !St.PageFlip) {
            console.error("St.PageFlip not loaded.");
            return;
        }

        if (isNaN(singlePageW) || isNaN(singlePageH) || singlePageW < 100) {
            const scaleFactor = parseFloat(rootStyle.getPropertyValue('--scale-factor')) || 1;
            const fallbackW = 1104 * scaleFactor;
            const fallbackH = 1452 * scaleFactor;

            pageFlip = new St.PageFlip(bookEl, {
                width: fallbackW,
                height: fallbackH,
                startPage: 0,
                size: 'fixed',
                drawShadow: true,
                maxShadowOpacity: 0.5,
                showCover: true,
                flippingTime: 700,
                cornerSize: 15,
                swipeDistance: 10,
                disableFlipByClick: true
            });
        } else {
            pageFlip = new St.PageFlip(bookEl, {
                width: singlePageW,
                height: singlePageH,
                startPage: 0,
                size: 'fixed',
                drawShadow: true,
                maxShadowOpacity: 0.35,
                showCover: true,
                flippingTime: 700,
                cornerSize: 15,
                disableFlipByClick: true
            });
        }

        const pages = document.querySelectorAll('.my-page');
        if (pages.length) pageFlip.loadFromHTML(pages);

        pageFlipInstance = pageFlip;

        if (bookPrev) bookPrev.addEventListener('click', () => pageFlipInstance?.flipPrev());
        if (bookNext) bookNext.addEventListener('click', () => pageFlipInstance?.flipNext());

        if (pageFlipInstance && typeof pageFlipInstance.on === 'function') {
            pageFlipInstance.on('flip', (e) => updatePageControls(e.object));
            pageFlipInstance.on('init', (e) => updatePageControls(e.object));
            pageFlipInstance.on('load', (e) => updatePageControls(e.object));
        } else {
            updatePageControls(pageFlipInstance);
        }
    };

    // --- Maximize book ---
    function toggleMaximize() {
        if(!bookWidget) bookWidget = document.querySelector('.book-widget');
        if(!bookWidget) return;

        isMaximized = !isMaximized;

        if (isMaximized) {
            const startRect = bookWidget.getBoundingClientRect();
            
            let spacer = document.getElementById('book-spacer');
            if(!spacer) {
                spacer = document.createElement('div');
                spacer.id = 'book-spacer';
                
                // --- FIX: Copy layout styles so the landing spot is accurate ---
                const computed = window.getComputedStyle(bookWidget);
                spacer.style.width = computed.width;
                spacer.style.height = computed.height;
                spacer.style.left = computed.left;
                spacer.style.top = computed.top;
                spacer.style.position = computed.position;
                spacer.style.margin = computed.margin;
                spacer.style.display = computed.display;
                spacer.style.flexDirection = computed.flexDirection;
                // -----------------------------------------------------------

                bookWidget.parentNode.insertBefore(spacer, bookWidget);
            }

            document.body.classList.add('book-is-maximized');
            
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;
            const startCenterX = startRect.left + (startRect.width / 2);
            const startCenterY = startRect.top + (startRect.height / 2);
            
            const initialX = startCenterX - screenCenterX;
            const initialY = startCenterY - screenCenterY;
            
            const originalTransition = getComputedStyle(bookWidget).transition;
            bookWidget.style.transition = 'none';
            bookWidget.style.transform = `translate(calc(-50% + ${initialX}px), calc(-50% + ${initialY}px)) scale(1)`;
            
            bookWidget.offsetHeight; 
            bookWidget.style.transition = originalTransition;
            
            if(bookMaximizeBtn) {
                bookMaximizeBtn.innerHTML = '<i class="fas fa-compress"></i>';
            }
            
            const targetW = window.innerWidth * 0.90;
            const targetH = window.innerHeight * 0.90;
            const scaleW = targetW / bookWidget.offsetWidth;
            const scaleH = targetH / bookWidget.offsetHeight;
            const finalScale = Math.min(scaleW, scaleH);
            
            bookWidget.style.transform = `translate(-50%, -50%) scale(${finalScale})`;
            
        } else {
            // --- SHRINK LOGIC ---
            const spacer = document.getElementById('book-spacer');
            if (!spacer) {
                document.body.classList.remove('book-is-maximized');
                bookWidget.style.transform = '';
                return;
            }

            // Now the spacer is correctly offset by 50px, so this measurement is accurate
            const targetRect = spacer.getBoundingClientRect();
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;
            const targetCenterX = targetRect.left + (targetRect.width / 2);
            const targetCenterY = targetRect.top + (targetRect.height / 2);
            
            const finalX = targetCenterX - screenCenterX;
            const finalY = targetCenterY - screenCenterY;
            
            bookWidget.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px)) scale(1)`;
            
            setTimeout(() => {
                if (!isMaximized) {
                    bookWidget.style.transition = 'none';
                    document.body.classList.remove('book-is-maximized');
                    bookWidget.style.transform = '';
                    spacer.remove();

                    void bookWidget.offsetHeight; 
                    bookWidget.style.transition = ''; 
                    
                    if(bookMaximizeBtn) {
                        bookMaximizeBtn.innerHTML = '<i class="fas fa-expand"></i>';
                    }
                }
            }, 400); 
        }
    }

    if (bookMaximizeBtn) {
        bookMaximizeBtn.addEventListener('click', toggleMaximize);
    }
    
    // Listen for Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMaximized) toggleMaximize();
    });

    // --- FLOATING NOTES SYSTEM ---
    const floatingNotes = new Map();
    let draggedNoteId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

  

// Inside initializeBookSystem(el) in book.js

function initializeBookNotes() {
    const bookNotes = document.querySelectorAll('.book-note');

    bookNotes.forEach(note => {
        if (!note.querySelector('.note-pin-btn')) {
            const pinBtn = document.createElement('button');
            pinBtn.className = 'note-pin-btn';
            pinBtn.innerHTML = '✕';
            pinBtn.title = "Pin to corkboard";
            
            pinBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                animateNoteToCorkboard(note);
            });
            note.appendChild(pinBtn);
        }

        note.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || e.target.classList.contains('note-pin-btn')) return;
            e.preventDefault();
            e.stopPropagation();
            createFloatingNoteFrom(note, e.clientX, e.clientY);
        });
    });
}

function animateNoteToCorkboard(note) {
    const corkboard = document.querySelector('.corkboard');
    const cubeWrapper = document.getElementById('cubeWrapper');
    if (!corkboard || !cubeWrapper) return;

    const rect = note.getBoundingClientRect();
    
    // Create "Flying" clone
    const flyer = document.createElement('div');
    flyer.className = 'floating-note flying-to-board';
    flyer.textContent = note.childNodes[0].textContent; 
    flyer.style.left = rect.left + 'px';
    flyer.style.top = rect.top + 'px';
    flyer.style.width = rect.width + 'px';
    flyer.style.height = rect.height + 'px';
    document.body.appendChild(flyer);

    // Hide original note in book
    note.style.visibility = 'hidden';

    // Pan Up
    cubeWrapper.classList.add('pan-up');

    requestAnimationFrame(() => {
        flyer.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        flyer.style.top = '-200px'; 
        flyer.style.opacity = '0';
        flyer.style.transform = 'scale(1.5) rotate(15deg)';
    });

    setTimeout(() => {
        const pinned = document.createElement('div');
        pinned.className = 'pinned-note';
        pinned.textContent = flyer.textContent;

        const pinHead = document.createElement('div');
        pinHead.className = 'push-pin';
        pinHead.title = "Double-click to return to book"; // Tooltip hint
        pinned.appendChild(pinHead);

        // Random starting position
        const randomX = Math.random() * 60 + 20; 
        const randomY = Math.random() * 60 + 20;
        const randomRot = (Math.random() - 0.5) * 15;

        pinned.style.left = `${randomX}%`;
        pinned.style.top = `${randomY}%`;
        pinned.style.transform = `rotate(${randomRot}deg)`;

        corkboard.appendChild(pinned);
        
        // --- PASS THE ORIGINAL NOTE REFERENCE HERE ---
        makePinnedNoteDraggable(pinned, pinHead, note);
        
        flyer.remove();
    }, 700);
}

function makePinnedNoteDraggable(pinnedNote, pinHead, originalNote) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    // --- DOUBLE CLICK TO RETURN ---
    pinHead.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        animateNoteBackToBook(pinnedNote, originalNote);
    });

    pinHead.addEventListener('mousedown', (e) => {
        isDragging = true;
        pinnedNote.style.zIndex = '1000'; 
        
        const rect = pinnedNote.getBoundingClientRect();
        const corkRect = pinnedNote.offsetParent.getBoundingClientRect();
        
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left - corkRect.left;
        initialTop = rect.top - corkRect.top;

        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const corkboard = pinnedNote.offsetParent;
        const maxX = corkboard.clientWidth - pinnedNote.offsetWidth;
        const maxY = corkboard.clientHeight - pinnedNote.offsetHeight;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        newLeft = Math.max(0, Math.min(newLeft, maxX));
        newTop = Math.max(0, Math.min(newTop, maxY));

        pinnedNote.style.left = `${newLeft}px`;
        pinnedNote.style.top = `${newTop}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            pinnedNote.style.zIndex = '';
        }
    });
}

function animateNoteBackToBook(pinnedNote, originalNote) {
    const cubeWrapper = document.getElementById('cubeWrapper');
    if (!cubeWrapper) return;

    const rect = pinnedNote.getBoundingClientRect();
    
    // Create a flyer for the return journey
    const flyer = document.createElement('div');
    flyer.className = 'floating-note flying-to-book';
    flyer.textContent = pinnedNote.textContent; 
    flyer.style.left = rect.left + 'px';
    flyer.style.top = rect.top + 'px';
    flyer.style.width = rect.width + 'px';
    flyer.style.height = rect.height + 'px';
    document.body.appendChild(flyer);

    // Remove the pinned version immediately
    pinnedNote.remove();

    // Pan back down to the book
    cubeWrapper.classList.remove('pan-up');

    // Animate the flyer "falling" back into the book
    requestAnimationFrame(() => {
        flyer.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        flyer.style.top = '120%'; // Fly down towards the book's area
        flyer.style.opacity = '0';
        flyer.style.transform = 'scale(0.5) rotate(-15deg)';
    });

    // Restore the original note once the pan is nearly done
    setTimeout(() => {
        originalNote.style.visibility = 'visible';
        flyer.remove();
    }, 700);
}
    
    function pinNoteToCorkboard(originalNote) {
        const corkboard = document.querySelector('.corkboard');
        if (!corkboard) return;
    
        // Create the pinned version
        const pinned = document.createElement('div');
        pinned.className = 'pinned-note';
        
        // Get text only (excluding the 'X' button text)
        const noteText = originalNote.childNodes[0].textContent;
        pinned.textContent = noteText;
    
        // Add a visual pin head
        const pinHead = document.createElement('div');
        pinHead.className = 'push-pin';
        pinned.appendChild(pinHead);
    
        // Randomize position and rotation for the corkboard look
        const randomX = Math.random() * 80 + 5; // 5% to 85%
        const randomY = Math.random() * 80 + 5;
        const randomRot = (Math.random() - 0.5) * 15; // -7.5 to 7.5 degrees
    
        pinned.style.left = `${randomX}%`;
        pinned.style.top = `${randomY}%`;
        pinned.style.transform = `rotate(${randomRot}deg)`;
    
        corkboard.appendChild(pinned);
    
        // Hide the original note in the book
        originalNote.style.display = 'none';
    }

    function createFloatingNoteFrom(originalNote, startX, startY) {
        const rect = originalNote.getBoundingClientRect();

        const clone = document.createElement('div');
        clone.classList.add('floating-note');
        clone.textContent = originalNote.textContent;
        clone.dataset.originalId = originalNote.dataset.noteId;

        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';

        document.body.appendChild(clone);

        originalNote.style.visibility = 'hidden';
        originalNote.style.opacity = '0';

        const offsetX = startX - rect.left;
        const offsetY = startY - rect.top;

        startDraggingFloatingNote(clone, originalNote, offsetX, offsetY);
    }

    function startDraggingFloatingNote(clone, originalNote, offsetX, offsetY) {
        const onMouseMove = (e) => {
            clone.style.left = (e.clientX - offsetX) + 'px';
            clone.style.top = (e.clientY - offsetY) + 'px';
        };

        const onMouseUp = (e) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            clone.style.display = 'none';
            const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
            clone.style.display = 'flex';

            const targetPage = elementBelow ? elementBelow.closest('.my-page') : null;

            if (targetPage) {
                const pageRect = targetPage.getBoundingClientRect();
                const cloneRect = clone.getBoundingClientRect();

                const noteWidth = cloneRect.width;
                const noteHeight = cloneRect.height;
                const pageWidth = pageRect.width;
                const pageHeight = pageRect.height;
                const padding = 5;

                let relativeLeft = cloneRect.left - pageRect.left;
                let relativeTop = cloneRect.top - pageRect.top;

                relativeLeft = Math.max(padding, Math.min(relativeLeft, pageWidth - noteWidth - padding));
                relativeTop = Math.max(padding, Math.min(relativeTop, pageHeight - noteHeight - padding));

                originalNote.style.left = relativeLeft + 'px';
                originalNote.style.top = relativeTop + 'px';

                originalNote.style.transform = 'none';

                targetPage.appendChild(originalNote);

                originalNote.style.visibility = 'visible';
                originalNote.style.opacity = '1';

                clone.remove();

            } else {
                clone.style.pointerEvents = 'auto';
                clone.onmousedown = (evt) => {
                    if (evt.button !== 0) return;
                    evt.preventDefault();
                    const newRect = clone.getBoundingClientRect();
                    startDraggingFloatingNote(clone, originalNote, evt.clientX - newRect.left, evt.clientY - newRect.top);
                };
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function handleNoteDrag(e) {
        if (!draggedNoteId) return;

        const noteId = draggedNoteId;
        let floatingNote = floatingNotes.get(noteId);
        const bookWidget = document.querySelector('.book-widget');

        if (!floatingNote) {
            const bookNote = document.querySelector(`[data-note-id="${noteId}"]`);
            if (!bookNote) return;

            floatingNote = document.createElement('div');
            floatingNote.className = 'floating-note dragging';
            floatingNote.textContent = bookNote.textContent;
            floatingNote.dataset.noteId = noteId;

            const closeBtn = document.createElement('button');
            closeBtn.className = 'floating-note-close';
            closeBtn.innerHTML = '✕';
            closeBtn.addEventListener('click', () => removeFloatingNote(noteId));
            floatingNote.appendChild(closeBtn);

            const container = el('floatingNotesContainer');
            if (container) container.appendChild(floatingNote);
            else document.body.appendChild(floatingNote);

            floatingNotes.set(noteId, floatingNote);

            bookNote.style.display = 'none';

            floatingNote.addEventListener('mousedown', handleFloatingNoteMouseDown);
        }

        if (bookWidget) {
             let currentScale = 1;
             // Extract scale if present to correct mouse speed
            if(bookWidget.style.transform && bookWidget.style.transform.includes('scale')) {
                const match = bookWidget.style.transform.match(/scale\(([^)]+)\)/);
                if(match) currentScale = parseFloat(match[1]);
            }
            
            // Standard Drag
            floatingNote.style.left = (e.clientX - dragOffsetX) + 'px';
            floatingNote.style.top = (e.clientY - dragOffsetY) + 'px';
        } else {
            floatingNote.style.left = (e.clientX - dragOffsetX) + 'px';
            floatingNote.style.top = (e.clientY - dragOffsetY) + 'px';
        }
        e.preventDefault();
    }

    function handleFloatingNoteMouseDown(e) {
        if (e.button !== 0) return;
        if (e.target.classList.contains('floating-note-close')) return;

        const noteId = this.dataset.noteId;
        const rect = this.getBoundingClientRect();

        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        draggedNoteId = noteId;
        this.classList.add('dragging');
        document.addEventListener('mousemove', handleNoteDrag);
        document.addEventListener('mouseup', handleNoteMouseUp);

        e.preventDefault();
    }

    function removeFloatingNote(noteId) {
        const floatingNote = floatingNotes.get(noteId);
        const bookNote = document.querySelector(`[data-note-id="${noteId}"]`);

        if (floatingNote) {
            floatingNote.remove();
            floatingNotes.delete(noteId);
        }

        if (bookNote) {
            bookNote.style.display = '';
        }
    }

    function handleNoteMouseUp(e) {
        if (!draggedNoteId) return;

        const noteId = draggedNoteId;
        const bookWidget = document.querySelector('.book-widget');
        const bookRect = bookWidget ? bookWidget.getBoundingClientRect() : { left: 0, right: 0, top: 0, bottom: 0 };

        const isOverBook = (
            e.clientX >= bookRect.left &&
            e.clientX <= bookRect.right &&
            e.clientY >= bookRect.top &&
            e.clientY <= bookRect.bottom
        );

        if (isOverBook) {
            removeFloatingNote(noteId);
            draggedNoteId = null;
            document.removeEventListener('mousemove', handleNoteDrag);
            document.removeEventListener('mouseup', handleNoteMouseUp);
            return;
        }

        const floatingNote = floatingNotes.get(noteId);
        if (floatingNote) floatingNote.classList.remove('dragging');

        document.removeEventListener('mousemove', handleNoteDrag);
        document.removeEventListener('mouseup', handleNoteMouseUp);

        draggedNoteId = null;
    }

    function initFlashlight() {
        const pageContainer = document.getElementById('flashlightPage');
        if (!pageContainer) return;
    
        const revealLayer = pageContainer.querySelector('.layer-reveal');
    
        pageContainer.addEventListener('mousemove', (e) => {
            // Get the position of the page relative to the viewport
            const rect = pageContainer.getBoundingClientRect();
    
            // Calculate mouse X and Y relative to the page
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
    
            // Update CSS variables
            revealLayer.style.setProperty('--x', `${x}px`);
            revealLayer.style.setProperty('--y', `${y}px`);
        });
    }

    // Initialize Logic
    initializePageFlip();
    initializeBookNotes();
    initFlashlight();
}