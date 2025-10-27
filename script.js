// Handle tab switching
document.querySelectorAll('.pda-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pda-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pda-tab-content').forEach(c => c.classList.remove('active'));
  
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
  
  // Handle closing
  document.querySelector('.pda-close').addEventListener('click', () => {
    document.querySelector('.pda-window').style.display = 'none';
  });
  
  // Notekeeper logic
  const noteInput = document.getElementById('noteInput');
  const noteContainer = document.getElementById('noteContainer');
  
  noteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && noteInput.value.trim() !== '') {
      addNote(noteInput.value);
      noteInput.value = '';
    }
  });
  
  function addNote(text) {
    const note = document.createElement('div');
    note.classList.add('note');
    note.innerHTML = `<span>${text}</span><button>×</button>`;
  
    note.querySelector('button').addEventListener('click', () => {
      note.remove();
    });
  
    noteContainer.appendChild(note);
  }
  