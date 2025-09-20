// audio-manager.js - versión consolidada
class AudioManager {
  constructor() {
    if (window.audioManagerGlobal) return window.audioManagerGlobal;

    this.ids = ['backgroundMusic1','backgroundMusic2','backgroundMusic3'];
    this.audioElements = [];
    this.currentSongIndex = 0;
    this.isMusicOn = false;
    this.volume = 0.5;
    this.currentTime = 0;
    this.isInitialized = false;

    this.loadState();
    window.addEventListener('DOMContentLoaded', ()=> this.setupAudioElements());
    window.audioManagerGlobal = this;
  }

  loadState() {
    this.isMusicOn = localStorage.getItem('challengeme_music_enabled') === 'true';
    this.volume = parseFloat(localStorage.getItem('challengeme_volume')) || 0.5;
    this.currentSongIndex = parseInt(localStorage.getItem('challengeme_current_song')) || 0;
    this.currentTime = parseFloat(localStorage.getItem('challengeme_current_time')) || 0;
  }

  saveState() {
    localStorage.setItem('challengeme_music_enabled', this.isMusicOn);
    localStorage.setItem('challengeme_volume', this.volume);
    localStorage.setItem('challengeme_current_song', this.currentSongIndex);
    if (this.isMusicOn && this.audioElements[this.currentSongIndex]) {
      localStorage.setItem('challengeme_current_time', this.audioElements[this.currentSongIndex].currentTime);
    }
  }

  setupAudioElements() {
    if (this.isInitialized) return;
    this.audioElements = this.ids.map(id => document.getElementById(id)).filter(Boolean);
    if (this.audioElements.length === 0) {
      console.warn('No audio elements found');
      return;
    }

    this.audioElements.forEach((audio, index) => {
      audio.preload = 'metadata';
      audio.volume = this.volume;
      audio.crossOrigin = 'anonymous';

      audio.addEventListener('ended', () => {
        if (index === this.currentSongIndex) this.playNextSong();
      });

      audio.addEventListener('timeupdate', () => {
        if (this.isMusicOn && index === this.currentSongIndex) {
          localStorage.setItem('challengeme_current_time', audio.currentTime);
        }
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio error', e, audio.src, audio.error);
      });
    });

    if (this.isMusicOn) {
      setTimeout(()=> this.tryPlayWithFallback(), 200);
    }

    window.addEventListener('beforeunload', ()=> this.saveState());
    document.addEventListener('visibilitychange', ()=> {
      this.saveState();
      if (!document.hidden && this.isMusicOn) this.tryPlayWithFallback();
    });

    this.isInitialized = true;
  }

  tryPlayWithFallback() {
    const current = this.audioElements[this.currentSongIndex];
    if (!current) return;
    const attempt = () => {
      if (this.currentTime && !isNaN(this.currentTime)) {
        try { current.currentTime = Math.min(this.currentTime, current.duration || this.currentTime); }
        catch(e) {}
      }
      const p = current.play();
      if (p && typeof p.catch === 'function') {
        p.catch(err => {
          console.warn('Autoplay prevented:', err);
          this.showPlayPrompt();
        });
      }
    };

    if (current.readyState >= 2) attempt();
    else {
      current.addEventListener('canplay', attempt, { once: true });
      current.load();
    }
  }

  showPlayPrompt() {
    if (document.getElementById('audio-play-prompt')) return;
    const overlay = document.createElement('div');
    overlay.id = 'audio-play-prompt';
    overlay.style = 'position:fixed;right:16px;bottom:16px;z-index:9999;';
    overlay.innerHTML = '<button id="audio-play-btn" style="padding:10px 14px;border-radius:8px;background:#ef4444;color:#fff;border:0;cursor:pointer;">Reproducir música</button>';
    document.body.appendChild(overlay);
    document.getElementById('audio-play-btn').addEventListener('click', async () => {
      document.body.removeChild(overlay);
      this.isMusicOn = true;
      this.saveState();
      this.playCurrentSong();
    }, { once: true });
  }

  playCurrentSong() {
    if (this.audioElements.length === 0) return;
    this.isMusicOn = true;
    this.saveState();
    const current = this.audioElements[this.currentSongIndex];
    if (!current) return;
    current.volume = this.volume;
    try {
      if (this.currentTime && !isNaN(this.currentTime)) current.currentTime = Math.min(this.currentTime, current.duration || this.currentTime);
    } catch(e){}
    const p = current.play();
    if (p && typeof p.catch === 'function') {
      p.catch(err => {
        console.warn('play() rejected:', err);
        this.showPlayPrompt();
      });
    }
  }

  playNextSong() {
    if (!this.isMusicOn) return;
    const current = this.audioElements[this.currentSongIndex];
    if (current) { current.pause(); current.currentTime = 0; }
    this.currentSongIndex = (this.currentSongIndex + 1) % this.audioElements.length;
    this.saveState();
    this.playCurrentSong();
  }

  pauseAll() {
    this.audioElements.forEach(a => { a.pause(); });
    localStorage.removeItem('challengeme_current_time');
  }

  toggleMusic() {
    this.isMusicOn = !this.isMusicOn;
    this.saveState();
    if (this.isMusicOn) this.tryPlayWithFallback();
    else this.pauseAll();
  }

  setVolume(v) {
    this.volume = v;
    this.audioElements.forEach(a => { a.volume = v; });
    this.saveState();
  }
}

window.audioManager = new AudioManager();
