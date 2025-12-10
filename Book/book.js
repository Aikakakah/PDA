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
                flippingTime: 700
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
                flippingTime: 700
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

    // --- NEW: Maximize Logic (Fixed) ---
    function toggleMaximize() {
        // Ensure we have the widget
        if(!bookWidget) bookWidget = document.querySelector('.book-widget');
        if(!bookWidget) return;

        isMaximized = !isMaximized;

        if (isMaximized) {
            // Enter Maximize Mode
            document.body.classList.add('book-is-maximized');
            if(bookMaximizeBtn) {
                bookMaximizeBtn.innerHTML = '<i class="fas fa-compress"></i>';
                bookMaximizeBtn.title = "Exit Fullscreen";
            }
            
            // 1. Get exact current pixel size of the book
            const baseW = bookWidget.offsetWidth;
            const baseH = bookWidget.offsetHeight;

            // 2. Define target size (90% of screen)
            const targetW = window.innerWidth * 0.90;
            const targetH = window.innerHeight * 0.90;

            // 3. Calculate how much to scale
            // If the book hasn't loaded fully yet, prevent division by zero
            if (baseW > 0 && baseH > 0) {
                const scaleW = targetW / baseW;
                const scaleH = targetH / baseH;
                const finalScale = Math.min(scaleW, scaleH);
                
                // 4. Apply Transform
                // translate(-50%, -50%) centers it. scale(...) makes it big.
                bookWidget.style.transform = `translate(-50%, -50%) scale(${finalScale})`;
            }
            
        } else {
            // Exit Maximize Mode
            document.body.classList.remove('book-is-maximized');
            if(bookMaximizeBtn) {
                bookMaximizeBtn.innerHTML = '<i class="fas fa-expand"></i>';
                bookMaximizeBtn.title = "Toggle Fullscreen Book";
            }
            
            // Reset Transform
            bookWidget.style.transform = '';
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

    function initializeBookNotes() {
        const bookNotes = document.querySelectorAll('.book-note');

        bookNotes.forEach(note => {
            note.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                createFloatingNoteFrom(note, e.clientX, e.clientY);
            });
        });
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

    // Initialize Logic
    initializePageFlip();
    initializeBookNotes();
}