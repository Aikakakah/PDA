// music.js

export function createMusicModule(state, el, showView) {
    // Only standard MP3 tracks are kept here
    const tracks = [
        {
            id: 'stardust',
            title: 'Stardust',
            artist: 'NTTD Archive',
            duration: '2:18',
            src: './Audio/Stardust.mp3'
        },
        {
            id: 'star',
            title: 'Star',
            artist: 'NTTD Archive',
            duration: '2:18',
            src: './Audio/Stardust.mp3'
        },
        {
            id: 'dust',
            title: 'Dust',
            artist: 'NTTD Archive',
            duration: '2:18',
            src: './Audio/Stardust.mp3'
        }
    ];

    let currentTrackIndex = state.music?.currentTrack || 0;
    let audioPlayer = null;

    if (!state.music) {
        state.music = {
            currentTrack: 0,
            isPlaying: false
        };
    }

    function renderMusicProgram() {
        const programArea = el('programArea');
        if (!programArea) return;

        const track = tracks[currentTrackIndex];
        const playingLabel = state.music.isPlaying ? 'Playing' : 'Paused';
        const playIcon = state.music.isPlaying ? 'pause' : 'play';

        const wrap = document.createElement('div');
        wrap.className = 'music-player';
        wrap.innerHTML = `
            <div class="music-header">Music Player</div>
            <div class="music-body">
                <div class="songlist-sidebar" id="songlistSidebar"></div>
                <div class="song-info" id="songInfo">
                    <div class="music-title">${track.title}</div>
                    <div class="music-artist">${track.artist}</div>
                    <div class="music-content">
                        <div class="music-track-info">
                            <span>${playingLabel}</span>
                            <span>${track.duration}</span>
                        </div>
                        <div class="music-playlist">
                            ${tracks.map((t, idx) => `
                                <button class="music-track ${idx === currentTrackIndex ? 'active' : ''}" data-track="${idx}">
                                    ${t.title}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="music-controls">
                        <button id="music-prev" title="Previous"><i class="fas fa-chevron-left"></i></button>
                        <button id="music-play" title="${state.music.isPlaying ? 'Pause' : 'Play'}"><i class="fas fa-${playIcon}"></i></button>
                        <button id="music-next" title="Next"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
            
            
        `;

        programArea.innerHTML = '';
        programArea.appendChild(wrap);
        showView('program');

        el('music-prev')?.addEventListener('click', () => {
            changeTrack(-1);
        });

        el('music-next')?.addEventListener('click', () => {
            changeTrack(1);
        });

        el('music-play')?.addEventListener('click', () => {
            if (state.music.isPlaying) {
                pausePlayback();
            } else {
                startPlayback();
            }
            renderMusicProgram();
        });

        document.querySelectorAll('.music-track').forEach(button => {
            button.addEventListener('click', () => {
                const selected = Number(button.dataset.track);
                if (selected !== currentTrackIndex) {
                    setTrack(selected);
                    startPlayback();
                    renderMusicProgram();
                }
            });
        });
    }

    function stopPlayback() {
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            audioPlayer = null;
        }
    }

    function setTrack(index) {
        currentTrackIndex = Math.max(0, Math.min(index, tracks.length - 1));
        state.music.currentTrack = currentTrackIndex;
        state.music.isPlaying = false;
        stopPlayback();
    }

    function changeTrack(delta) {
        let nextIndex = currentTrackIndex + delta;
        if (nextIndex < 0) nextIndex = tracks.length - 1;
        if (nextIndex >= tracks.length) nextIndex = 0;
        setTrack(nextIndex);
        startPlayback();
        renderMusicProgram();
    }

    function startPlayback() {
        const track = tracks[currentTrackIndex];
        stopPlayback();

        if (track.src) {
            audioPlayer = new Audio(track.src);
            audioPlayer.onended = () => {
                state.music.isPlaying = false;
                renderMusicProgram();
            };
            audioPlayer.play().catch(() => {});
            state.music.isPlaying = true;
        }
    }

    function pausePlayback() {
        state.music.isPlaying = false;
        if (audioPlayer) {
            audioPlayer.pause();
        }
    }

    return {
        renderMusicProgram: renderMusicProgram
    };
}