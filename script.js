// PDA Replica script
(() => {
  // State
  const state = {
    owner: "Ramona Orthall",
    id: "Ramona Orthall",
    job: "Scientist",
    station: "[ERROR]",
    alert: "Green",
    instructions: "Don't stray far.",
    currentDate: new Date(), // Define the initial date
    shiftStart: Date.now(),
    flashlight: false,
    stylus: false,
    poweredOn: true,
    programs: [
      { uid: 1, name: "Crew manifest", icon: "CM", type: "manifest" },
      { uid: 2, name: "Notekeeper", icon: "NK", type: "notekeeper" },
      { uid: 3, name: "Station news", icon: "News", type: "news" },
      { uid: 4, name: "NanoChat", icon: "NC", type: "nanochat" }
    ],
    notes: ["Check filter", "Bring gloves"]
};
  // Advance date by ~630 days
state.currentDate.setFullYear(state.currentDate.getFullYear() + 630);

  // Elements
  const el = id => document.getElementById(id);
  const pda = el('pda');
  const views = { home: el('view-home'), programs: el('view-programs'), settings: el('view-settings'), program: el('view-program') };
  const tabs = document.querySelectorAll('.nav-btn');
  const programGrid = el('programGrid');
  const btnLight = el('btn-light');
  const btnStylus = el('btn-stylus');
  const btnFull = el('btn-full');
  const btnEject = el('btn-eject');
  const accentPicker = el('accentPicker');
  const powerOverlay = el('powerOverlay');
  const powerOn = el('powerOn');
  const progClose = el('progClose');
  const programArea = el('programArea');
  const programTitleMini = el('programTitleMini');
  const lightIndicator = el('lightIndicator');

  // Quick helpers
  function $(sel, ctx=document) { return ctx.querySelector(sel); }
  function showView(v) {
    Object.values(views).forEach(x => x.classList.remove('active'));
    views[v].classList.add('active');
  }

  // Update home info
  function updateHome() {
    el('owner').textContent = state.owner;
    el('idline').innerHTML = `${state.id}, <span id="job" class="job">${state.job}</span>`;
    el('station').textContent = state.station;
    el('instructions').textContent = state.instructions;
    el('date').textContent = state.currentDate.toLocaleDateString(undefined,{ day: '2-digit', month:'long', year:'numeric' });
    el('alert').textContent = state.alert;
    el('alert').className = 'alert ' + (state.alert.toLowerCase() === 'green' ? 'green' : 'red');
    // shift duration
    const elapsed = Date.now() - state.shiftStart;
    const hh = String(Math.floor(elapsed/3600000)).padStart(2,'0');
    const mm = String(Math.floor((elapsed%3600000)/60000)).padStart(2,'0');
    const ss = String(Math.floor((elapsed%60000)/1000)).padStart(2,'0');
    el('shift').textContent = `${hh}:${mm}:${ss}`;
  }

  // Periodic shift timer update
  setInterval(updateHome, 1000);
  updateHome();

  // Render program tiles
  function renderPrograms() {
    programGrid.innerHTML = '';
    for (const p of state.programs) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.uid = p.uid;
      tile.innerHTML = `<div class="glyph">${p.icon}</div><div class="label">${p.name}</div>`;
      tile.addEventListener('click', () => openProgram(p));
      programGrid.appendChild(tile);
    }
  }

  // Open a program view (cartridge)
  function openProgram(p) {
    programTitleMini.textContent = p.name;
    programTitleMini.classList.remove('hidden');
    showView('program');
    programArea.innerHTML = ''; // fill with program UI
    if (p.type === 'notekeeper') {
      renderNotekeeper();
    } else if (p.type === 'manifest') {
      programArea.innerHTML = `<div class="cartridge-header">Crew manifest</div><div class="muted">No crew connected (simulated)</div>`;
    } else {
      programArea.innerHTML = `<div class="cartridge-header">${p.name}</div><div class="muted">This cartridge is simulated.</div>`;
    }
  }

  // Notekeeper UI
  function renderNotekeeper() {
    const wrap = document.createElement('div');
    wrap.className = 'notekeeper';
    wrap.innerHTML = `
      <div class="cartridge-header">Notekeeper</div>
      <div class="notes-wrap" id="notesWrap"></div>
      <div class="note-input">
        <input id="noteInput" placeholder="Type a note and press Enter" />
        <button id="addNoteBtn">Add</button>
      </div>
    `;
    programArea.appendChild(wrap);

    const notesWrap = wrap.querySelector('#notesWrap');
    const noteInput = wrap.querySelector('#noteInput');
    const addBtn = wrap.querySelector('#addNoteBtn');

    function refreshNotes() {
      notesWrap.innerHTML = '';
      for (const n of state.notes) {
        const row = document.createElement('div');
        row.className = 'note';
        const span = document.createElement('div');
        span.textContent = n;
        const rem = document.createElement('button');
        rem.textContent = '×';
        rem.addEventListener('click', () => {
          state.notes = state.notes.filter(x => x !== n);
          refreshNotes();
        });
        row.appendChild(span);
        row.appendChild(rem);
        notesWrap.appendChild(row);
      }
    }

    addBtn.addEventListener('click', () => {
      const v = noteInput.value.trim();
      if (!v) return;
      state.notes.push(v);
      noteInput.value = '';
      refreshNotes();
    });

    noteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });

    refreshNotes();
  }

  // Tab clicks
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      // set pressed styles
      document.querySelectorAll('.nav-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      // hide small program title if changing away from program
      programTitleMini.classList.add('hidden');
      showView(tab);
    });
  });

  // Program close
  progClose.addEventListener('click', () => {
    programTitleMini.classList.add('hidden');
    showView('programs');
  });

  // Light toggle
  btnLight.addEventListener('click', () => {
    state.flashlight = !state.flashlight;
    btnLight.setAttribute('aria-pressed', String(state.flashlight));
    if (state.flashlight) {
      lightIndicator.classList.remove('hidden');
      lightIndicator.textContent = 'Light ON';
    } else {
      lightIndicator.classList.add('hidden');
    }
  });

  // Stylus toggle (affects Notekeeper input placeholder color / highlight)
  btnStylus.addEventListener('click', () => {
    state.stylus = !state.stylus;
    btnStylus.setAttribute('aria-pressed', String(state.stylus));
    // give visual feedback on program area if Notekeeper opened
    if (views.program.classList.contains('active') && programArea.innerHTML.includes('note-input')) {
      const input = programArea.querySelector('input');
      if (input) {
        if (state.stylus) input.style.outline = `2px dashed ${getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#fff'}`;
        else input.style.outline = '';
      }
    }
  });

  // Fullscreen
  btnFull.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      pda.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  // Eject / power
  btnEject.addEventListener('click', () => {
    powerOverlay.classList.remove('hidden');
    pda.classList.add('powered-off');
    state.poweredOn = false;
  });
  powerOn.addEventListener('click', () => {
    powerOverlay.classList.add('hidden');
    pda.classList.remove('powered-off');
    state.poweredOn = true;
  });

  // Accent color picker
  accentPicker.addEventListener('input', (e) => {
    const c = e.target.value;
    document.documentElement.style.setProperty('--accent', c);
    // also set inner accent bars
    const ah = document.getElementById('accentH'), av = document.getElementById('accentV');
    if (ah) ah.style.background = c;
    if (av) av.style.background = c;
  });

  // Dragging pda
  (function makeDraggable() {
    const header = document.getElementById('header');
    let dragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', (e) => {
      dragging = true;
      const rect = pda.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      header.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      let nx = e.clientX - offsetX;
      let ny = e.clientY - offsetY;
      const margin = 8;
      nx = Math.max(margin, Math.min(nx, window.innerWidth - pda.offsetWidth - margin));
      ny = Math.max(margin, Math.min(ny, window.innerHeight - pda.offsetHeight - margin));
      pda.style.left = nx + 'px';
      pda.style.top = ny + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; header.style.cursor = 'grab'; });
  })();

  // copy-to-clipboard from home lines
  ['owner','idline','station','alert','shift','date','instructions'].forEach(id => {
    const node = el(id);
    if (node) node.addEventListener('click', () => {
      const text = node.innerText || node.textContent;
      navigator.clipboard?.writeText(text).then(()=> {
        // small visual flash
        node.animate([{opacity:1},{opacity:.6},{opacity:1}],{duration:250});
      }).catch(()=> {});
    });
  });

  // initial render
  renderPrograms();
  updateHome();

  // Expose simple API for external control if needed
  window.PDA = {
    openProgramByName(name) {
      const p = state.programs.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (p) openProgram(p);
    },
    setBorderColor(hex) {
      document.documentElement.style.setProperty('--accent', hex);
    },
    addProgram(p) {
      state.programs.push(p);
      renderPrograms();
    }
  };

})();
