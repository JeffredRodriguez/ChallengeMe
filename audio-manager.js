// audio-manager.js - Versión mejorada con persistencia entre páginas
class AudioManager {
    constructor() {
        // Verificar si ya existe una instancia global
        if (window.audioManagerGlobal) {
            return window.audioManagerGlobal;
        }
        
        this.audioElements = [];
        this.currentSongIndex = 0;
        this.isMusicOn = false;
        this.volume = 0.5;
        this.currentTime = 0;
        this.isInitialized = false;
        
        // Cargar estado desde localStorage
        this.loadState();
        
        // Configurar solo una vez
        this.setupAudioElements();
        
        // Hacer esta instancia global
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
        
        // Guardar el tiempo actual si hay audio activo
        if (this.isMusicOn && this.audioElements[this.currentSongIndex]) {
            localStorage.setItem('challengeme_current_time', this.audioElements[this.currentSongIndex].currentTime);
        }
    }
    
    setupAudioElements() {
        if (this.isInitialized) return;
        
        // Buscar elementos de audio en la página
        this.audioElements = [
            document.getElementById('backgroundMusic1'),
            document.getElementById('backgroundMusic2'),
            document.getElementById('backgroundMusic3')
        ].filter(Boolean); // Filtrar elementos nulos
        
        if (this.audioElements.length === 0) {
            console.warn('No se encontraron elementos de audio en la página');
            return;
        }
        
        // Configurar volumen
        this.audioElements.forEach(audio => {
            audio.volume = this.volume;
        });
        
        // Restaurar la reproducción desde el punto guardado
        if (this.isMusicOn) {
            // Pequeña demora para asegurar que los elementos de audio estén listos
            setTimeout(() => {
                this.playCurrentSong();
                
                // Restaurar el tiempo de reproducción si existe
                if (this.currentTime > 0 && this.audioElements[this.currentSongIndex]) {
                    this.audioElements[this.currentSongIndex].currentTime = this.currentTime;
                }
            }, 300);
        }
        
        // Configurar eventos para cuando terminen las canciones
        this.audioElements.forEach((audio, index) => {
            audio.addEventListener('ended', () => {
                if (index === this.currentSongIndex) {
                    this.playNextSong();
                }
            });
            
            // Guardar el tiempo periódicamente durante la reproducción
            audio.addEventListener('timeupdate', () => {
                if (this.isMusicOn && index === this.currentSongIndex) {
                    localStorage.setItem('challengeme_current_time', audio.currentTime);
                }
            });
        });
        
        // Guardar estado antes de que la página se descargue
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
        
        // Configurar eventos de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Guardar estado cuando la página se oculta
                this.saveState();
            } else if (this.isMusicOn) {
                // Reanudar cuando la página vuelve a ser visible
                this.playCurrentSong();
            }
        });
        
        this.isInitialized = true;
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
            // Limpiar el tiempo guardado cuando se pausa
            localStorage.removeItem('challengeme_current_time');
        }
    }
    
    playCurrentSong() {
        if (this.audioElements.length === 0 || !this.isMusicOn) return;
        
        const currentAudio = this.audioElements[this.currentSongIndex];
        if (currentAudio) {
            const playPromise = currentAudio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('La reproducción automática fue prevenida:', error);
                    // Reactivar con interacción del usuario
                    document.addEventListener('click', this.userInteractionHandler.bind(this), { once: true });
                });
            }
        }
    }
    
    userInteractionHandler() {
        if (this.isMusicOn) {
            this.playCurrentSong();
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
    // Usar una instancia global única
    window.audioManager = new AudioManager();
});

// Script para manejar la navegación entre páginas sin interrumpir el audio
document.addEventListener('DOMContentLoaded', function() {
    // Interceptar clics en enlaces para guardar el estado del audio
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && link.href !== '#' && 
            !link.getAttribute('href').startsWith('#')) {
            
            // Guardar el estado actual del audio antes de navegar
            if (window.audioManager && window.audioManager.isMusicOn && 
                window.audioManager.audioElements[window.audioManager.currentSongIndex]) {
                
                window.audioManager.currentTime = 
                    window.audioManager.audioElements[window.audioManager.currentSongIndex].currentTime;
                window.audioManager.saveState();
            }
        }
    });
});