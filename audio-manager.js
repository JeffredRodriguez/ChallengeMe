// audio-manager.js
class AudioManager {
    constructor() {
        this.audioElements = [];
        this.currentSongIndex = 0;
        this.isMusicOn = false;
        this.volume = 0.5;
        
        this.loadState();
        this.setupAudioElements();
    }
    
    loadState() {
        this.isMusicOn = localStorage.getItem('challengeme_music_enabled') === 'true';
        this.volume = parseFloat(localStorage.getItem('challengeme_volume')) || 0.5;
        this.currentSongIndex = parseInt(localStorage.getItem('challengeme_current_song')) || 0;
    }
    
    saveState() {
        localStorage.setItem('challengeme_music_enabled', this.isMusicOn);
        localStorage.setItem('challengeme_volume', this.volume);
        localStorage.setItem('challengeme_current_song', this.currentSongIndex);
    }
    
    setupAudioElements() {
        // Buscar elementos de audio en la página
        this.audioElements = [
            document.getElementById('backgroundMusic1'),
            document.getElementById('backgroundMusic2'),
            document.getElementById('backgroundMusic3')
        ].filter(Boolean); // Filtrar elementos nulos
        
        if (this.audioElements.length === 0) return;
        
        // Configurar volumen
        this.audioElements.forEach(audio => {
            audio.volume = this.volume;
        });
        
        // Si la música estaba encendida, reproducir la canción actual
        if (this.isMusicOn) {
            this.playCurrentSong();
        }
        
        // Configurar eventos para cuando terminen las canciones
        this.audioElements.forEach((audio, index) => {
            audio.addEventListener('ended', () => {
                if (index === this.currentSongIndex) {
                    this.playNextSong();
                }
            });
        });
    }
    
    playNextSong() {
        if (!this.isMusicOn) return;
        
        // Detener la canción actual
        const currentAudio = this.audioElements[this.currentSongIndex];
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        
        // Avanzar al siguiente índice
        this.currentSongIndex = (this.currentSongIndex + 1) % this.audioElements.length;
        this.saveState();
        
        // Reproducir la siguiente canción
        this.playCurrentSong();
    }
    
    toggleMusic() {
        this.isMusicOn = !this.isMusicOn;
        this.saveState();
        
        if (this.isMusicOn) {
            this.playCurrentSong();
        } else {
            this.pauseAll();
        }
    }
    
    playCurrentSong() {
        if (this.audioElements.length === 0) return;
        
        const currentAudio = this.audioElements[this.currentSongIndex];
        if (currentAudio) {
            currentAudio.play().catch(error => {
                console.log('Error al reproducir:', error);
            });
        }
    }
    
    pauseAll() {
        this.audioElements.forEach(audio => {
            if (audio) {
                audio.pause();
            }
        });
    }
    
    setVolume(volume) {
        this.volume = volume;
        this.audioElements.forEach(audio => {
            if (audio) audio.volume = volume;
        });
        this.saveState();
    }
}

// Inicializar el administrador de audio cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.audioManager = new AudioManager();
});