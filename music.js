// music.js

export function createMusicModule(state, el, showView) {
    // Only standard MP3 tracks are kept here
    const tracks = [
        {
            id: 'stardust',
            title: 'Stardust',
            artist: 'Hoagy Carmichael',
            info: 'Composed in 1927 under the title of "Then I Will Be Satisfied," Mitchell Parish’ lyrical additions led this song to quick fame and the renaming of the song to "Stardust." Recorded over 1,500 times, it now lives in the Great American Songbook.',
            duration: '2:18',
            src: './Audio/Stardust.mp3'
        },
        {
            id: 'star',
            title: 'Star',
            artist: 'NTTD Archive',
            info: 'Composed by Hoagy in 1985, this track was originally intended for a space-themed game that was ultimately scrapped. It was rediscovered in the NTTD archives and has since become a fan favorite.',
            duration: '2:18',
            src: './Audio/Stardust.mp3'
        },
        {
            id: 'dust',
            title: 'Dust',
            artist: 'NTTD Archive',
            info: 'Composed',
            duration: '2:18',
            src: './Audio/Stardust.mp3'
        }
    ];

    let currentTrackIndex = state.music?.currentTrack || 0;
    let audioPlayer = null;
    let isSeeking = false;
    let seekMouseMove = null;
    let seekMouseUp = null;

    if (!state.music) {
        state.music = {
            currentTrack: 0,
            isPlaying: false
        };
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
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
                
                    <div class="music-playlist">
                        ${tracks.map((t, idx) => `
                            <div class="music-track ${idx === currentTrackIndex ? 'active' : ''}" data-track="${idx}">
                                <div class="track-title">${t.title}</div>
                                <div class="track-artist">${t.artist}</div>
                            </div>
                        `).join('')}
                 
                </div>
                <div class="song-info" id="songInfo">
                    <div class="music-content">
                    <div class="music-title">${track.title}</div>
                    <div class="music-artist">${track.artist}</div>
                    <div class="music-info">${track.info}</div>
                        <div class="music-progress" id="musicProgress">
                            <div class="music-progress-track" id="musicProgressTrack">
                                <div class="music-progress-fill" id="musicProgressFill"></div>
                            </div>
                            <div class="music-progress-label">
                                <span id="musicCurrentTime">0:00</span>
                                <span id="musicDuration">${track.duration}</span>
                            </div>
                        </div>
                    </div>
                    <div class="music-controls">
                        <button id="music-prev" title="Previous"><i class="fas fa-step-backward"></i></button>
                        <button id="music-rewind" title="Rewind"><i class="fas fa-arrow-rotate-left"></i></button>
                        <button id="music-play" title="${state.music.isPlaying ? 'Pause' : 'Play'}"><i class="fas fa-fw fa-${playIcon}"></i></button>
                        <button id="music-forward" title="Forward"><i class="fas fa-arrow-rotate-right"></i></button>
                        <button id="music-next" title="Next"><i class="fas fa-step-forward"></i></button>
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

        el('music-rewind')?.addEventListener('click', () => {
            skipTime(-5);
        });

        el('music-forward')?.addEventListener('click', () => {
            skipTime(5);
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

        attachProgressHandlers();
        updateProgressUI();
    }

    function getSeekOffset(event) {
        const track = el('musicProgressTrack');
        if (!track) return 0;
        const rect = track.getBoundingClientRect();
        const clientX = event.clientX ?? (event.touches ? event.touches[0].clientX : 0);
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }

    function seekTo(offset) {
        const track = tracks[currentTrackIndex];
        if (!audioPlayer && track.src) {
            audioPlayer = new Audio(track.src);
            audioPlayer.ontimeupdate = updateProgressUI;
            audioPlayer.onloadedmetadata = updateProgressUI;
            audioPlayer.pause();
        }
        if (!audioPlayer || !audioPlayer.duration || !Number.isFinite(audioPlayer.duration)) return;
        audioPlayer.currentTime = audioPlayer.duration * offset;
        updateProgressUI();
    }

    function attachProgressHandlers() {
        const progressTrack = el('musicProgressTrack');
        if (!progressTrack) return;

        const onSeekStart = (event) => {
            event.preventDefault();
            isSeeking = true;
            const offset = getSeekOffset(event);
            seekTo(offset);

            if (!seekMouseMove) {
                seekMouseMove = (moveEvent) => {
                    if (!isSeeking) return;
                    const seekOffset = getSeekOffset(moveEvent);
                    seekTo(seekOffset);
                };
                window.addEventListener('mousemove', seekMouseMove);
                window.addEventListener('touchmove', seekMouseMove, { passive: false });
            }

            if (!seekMouseUp) {
                seekMouseUp = () => {
                    isSeeking = false;
                    window.removeEventListener('mousemove', seekMouseMove);
                    window.removeEventListener('touchmove', seekMouseMove);
                    window.removeEventListener('mouseup', seekMouseUp);
                    window.removeEventListener('touchend', seekMouseUp);
                    seekMouseMove = null;
                    seekMouseUp = null;
                };
                window.addEventListener('mouseup', seekMouseUp);
                window.addEventListener('touchend', seekMouseUp);
            }
        };

        progressTrack.addEventListener('mousedown', onSeekStart);
        progressTrack.addEventListener('touchstart', onSeekStart, { passive: false });
    }

    function updateProgressUI() {
        const fill = el('musicProgressFill');
        const currentLabel = el('musicCurrentTime');
        const durationLabel = el('musicDuration');
        if (!fill || !currentLabel || !durationLabel) return;

        const track = tracks[currentTrackIndex];
        let current = 0;
        let duration = 0;

        if (audioPlayer) {
            current = audioPlayer.currentTime || 0;
            duration = audioPlayer.duration || 0;
        }

        const progress = duration > 0 ? Math.min(1, current / duration) : 0;
        fill.style.width = `${progress * 100}%`;
        currentLabel.textContent = formatTime(current);
        durationLabel.textContent = duration > 0 ? formatTime(duration) : track.duration;
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
        
        // Resume existing audio if it's the same track and paused
        if (audioPlayer && !audioPlayer.ended) {
            audioPlayer.play().catch(() => {});
            state.music.isPlaying = true;
            return;
        }

        // Otherwise, create a fresh audio object for this track
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer = null;
        }

        if (track.src) {
            audioPlayer = new Audio(track.src);
            audioPlayer.onended = () => {
                state.music.isPlaying = false;
                renderMusicProgram();
            };
            audioPlayer.ontimeupdate = updateProgressUI;
            audioPlayer.onloadedmetadata = updateProgressUI;
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

    function skipTime(seconds) {
        if (!audioPlayer || !Number.isFinite(audioPlayer.duration)) return;
        audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.duration, audioPlayer.currentTime + seconds));
        updateProgressUI();
    }

    return {
        renderMusicProgram: renderMusicProgram
    };
}
