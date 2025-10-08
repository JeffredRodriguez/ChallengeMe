// AudioManager.js - Gestor de audio unificado
class AudioManager {
    constructor() {
        // Patrón Singleton - una sola instancia global
        if (window.audioManagerGlobal) {
            return window.audioManagerGlobal;
        }
        
        this.audioIds = ['backgroundMusic1', 'backgroundMusic2', 'backgroundMusic3'];
        this.audioElements = [];
        this.currentSongIndex = 0;
        this.isMusicOn = false;
        this.volume = 0.5;
        this.currentTime = 0;
        this.isInitialized = false;
        this.hasUserInteracted = false;
        
        // Cargar estado guardado
        this.loadState();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Hacer global
        window.audioManagerGlobal = this;
        
        console.log("✅ AudioManager inicializado - Estado:", {
            musicOn: this.isMusicOn,
            volume: this.volume,
            currentSong: this.currentSongIndex,
            currentTime: this.currentTime
        });
    }
    
    loadState() {
        try {
            const savedMusic = localStorage.getItem('challengeme_music_enabled');
            const savedVolume = localStorage.getItem('challengeme_volume');
            const savedSong = localStorage.getItem('challengeme_current_song');
            const savedTime = localStorage.getItem('challengeme_current_time');
            
            this.isMusicOn = savedMusic === 'true';
            this.volume = savedVolume ? parseFloat(savedVolume) : 0.5;
            this.currentSongIndex = savedSong ? parseInt(savedSong) : 0;
            this.currentTime = savedTime ? parseFloat(savedTime) : 0;
            
            console.log("📥 Estado cargado:", {
                music: this.isMusicOn,
                volume: this.volume,
                song: this.currentSongIndex,
                time: this.currentTime
            });
        } catch (error) {
            console.warn('Error cargando estado del audio:', error);
        }
    }
    
    saveState() {
        try {
            localStorage.setItem('challengeme_music_enabled', this.isMusicOn);
            localStorage.setItem('challengeme_volume', this.volume);
            localStorage.setItem('challengeme_current_song', this.currentSongIndex);
            
            if (this.isMusicOn && this.audioElements[this.currentSongIndex]) {
                const currentAudio = this.audioElements[this.currentSongIndex];
                const currentTime = currentAudio.currentTime || 0;
                localStorage.setItem('challengeme_current_time', currentTime);
            }
            
            console.log("💾 Estado guardado:", {
                music: this.isMusicOn,
                volume: this.volume,
                song: this.currentSongIndex,
                time: this.currentTime
            });
        } catch (error) {
            console.warn('Error guardando estado del audio:', error);
        }
    }
    
    setupEventListeners() {
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
        
        // Guardar estado antes de cerrar/abandonar la página
        window.addEventListener('beforeunload', () => this.saveState());
        window.addEventListener('pagehide', () => this.saveState());
        
        // Manejar visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log("📄 Página oculta - Guardando estado");
                this.saveState();
            } else if (this.isMusicOn && !this.isPlaying()) {
                console.log("📄 Página visible - Reanudando música");
                setTimeout(() => this.playCurrentSong(), 300);
            }
        });
        
        // Capturar interacción del usuario para autoplay
        const userInteractionEvents = ['click', 'touchstart', 'keydown'];
        userInteractionEvents.forEach(event => {
            document.addEventListener(event, () => {
                if (!this.hasUserInteracted) {
                    this.hasUserInteracted = true;
                    console.log("👆 Interacción del usuario detectada - Autoplay habilitado");
                    
                    // Intentar reproducir si la música está activada pero no suena
                    if (this.isMusicOn && !this.isPlaying()) {
                        setTimeout(() => this.playCurrentSong(), 100);
                    }
                }
            }, { once: true });
        });
    }
    
    initialize() {
        if (this.isInitialized) return;
        
        this.setupAudioElements();
        this.setupUIControls();
        this.isInitialized = true;
        
        console.log("🎵 AudioManager completamente inicializado");
    }
    
    setupAudioElements() {
        this.audioElements = this.audioIds.map(id => {
            const audio = document.getElementById(id);
            if (!audio) {
                console.warn(`⚠️ Elemento de audio no encontrado: ${id}`);
                return null;
            }
            
            console.log(`🔊 Configurando audio: ${id}`);
            
            // Configurar propiedades del audio
            audio.volume = this.volume;
            audio.preload = 'metadata';
            
            // Eventos para cada audio
            audio.addEventListener('loadedmetadata', () => {
                console.log(`📊 ${id} cargado - Duración: ${audio.duration}s`);
            });
            
            audio.addEventListener('ended', () => {
                if (this.isMusicOn && this.audioElements.indexOf(audio) === this.currentSongIndex) {
                    console.log(`🔚 ${id} terminó - Pasando a siguiente canción`);
                    this.playNextSong();
                }
            });
            
            audio.addEventListener('timeupdate', () => {
                if (this.isMusicOn && this.audioElements.indexOf(audio) === this.currentSongIndex) {
                    this.currentTime = audio.currentTime;
                }
            });
            
            audio.addEventListener('error', (e) => {
                console.error(`❌ Error en ${id}:`, audio.error);
            });
            
            return audio;
        }).filter(Boolean);
        
        if (this.audioElements.length === 0) {
            console.error('❌ No se encontraron elementos de audio válidos');
            return;
        }
        
        console.log(`✅ ${this.audioElements.length} elementos de audio configurados`);
        
        // Iniciar reproducción si estaba activa
        if (this.isMusicOn) {
            console.log("🎶 Reanudando música guardada...");
            setTimeout(() => this.playCurrentSong(), 800);
        }
    }
    
    setupUIControls() {
        console.log("🎛️ Configurando controles de UI...");
        
        // Buscar elementos de la UI
        const configBtn = document.getElementById('configBtn');
        const audioModal = document.getElementById('audioModal');
        const closeAudioModal = document.getElementById('closeAudioModal');
        const toggleMusicBtn = document.getElementById('toggleMusic');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        
        // Configurar botón de configuración
        if (configBtn && audioModal) {
            configBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("⚙️ Abriendo modal de audio");
                audioModal.classList.remove('hidden');
                this.updateMusicButton();
            });
        } else {
            console.warn("⚠️ Botón de configuración o modal no encontrados");
        }
        
        // Cerrar modal
        if (closeAudioModal && audioModal) {
            closeAudioModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("❌ Cerrando modal de audio");
                audioModal.classList.add('hidden');
            });
            
            audioModal.addEventListener('click', (e) => {
                if (e.target === audioModal) {
                    console.log("📪 Cerrando modal desde overlay");
                    audioModal.classList.add('hidden');
                }
            });
        }
        
        // Toggle música
        if (toggleMusicBtn) {
            toggleMusicBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("🔊 Alternando música");
                this.toggleMusic();
                this.updateMusicButton();
            });
        }
        
        // Control de volumen
        if (volumeSlider && volumeValue) {
            // Establecer volumen inicial desde estado guardado
            const initialVolume = Math.round(this.volume * 100);
            volumeSlider.value = initialVolume;
            volumeValue.textContent = `${initialVolume}%`;
            
            volumeSlider.addEventListener('input', (e) => {
                e.stopPropagation();
                const newVolume = volumeSlider.value / 100;
                this.setVolume(newVolume);
                volumeValue.textContent = `${volumeSlider.value}%`;
                console.log(`🔉 Volumen ajustado a: ${volumeSlider.value}%`);
            });
        }
        
        // Estado inicial del botón
        this.updateMusicButton();
        console.log("✅ Controles de UI configurados correctamente");
    }
    
    updateMusicButton() {
        const toggleMusicBtn = document.getElementById('toggleMusic');
        const musicToggleCircle = document.getElementById('musicToggleCircle');
        
        if (!toggleMusicBtn || !musicToggleCircle) {
            console.warn("⚠️ Elementos del botón de música no encontrados");
            return;
        }
        
        if (this.isMusicOn) {
            toggleMusicBtn.classList.add('bg-green-500');
            toggleMusicBtn.classList.remove('bg-gray-600');
            musicToggleCircle.style.transform = 'translateX(28px)';
            console.log("🟢 Botón de música: ACTIVADO");
        } else {
            toggleMusicBtn.classList.remove('bg-green-500');
            toggleMusicBtn.classList.add('bg-gray-600');
            musicToggleCircle.style.transform = 'translateX(0)';
            console.log("🔴 Botón de música: DESACTIVADO");
        }
    }
    
    isPlaying() {
        const currentAudio = this.audioElements[this.currentSongIndex];
        return currentAudio && !currentAudio.paused && !currentAudio.ended && currentAudio.currentTime > 0;
    }
    
    async playCurrentSong() {
        if (this.audioElements.length === 0 || !this.isMusicOn) {
            console.log("⏸️  No se puede reproducir: música desactivada o sin elementos");
            return;
        }
        
        const currentAudio = this.audioElements[this.currentSongIndex];
        if (!currentAudio) {
            console.error("❌ Audio actual no disponible");
            return;
        }
        
        console.log(`🎵 Intentando reproducir: ${currentAudio.id} en tiempo: ${this.currentTime}s`);
        
        // Pausar todos los audios primero
        this.pauseAll();
        
        // Configurar tiempo actual si está guardado
        if (this.currentTime > 0) {
            try {
                if (currentAudio.duration && this.currentTime < currentAudio.duration) {
                    currentAudio.currentTime = this.currentTime;
                    console.log(`⏱️  Tiempo restaurado: ${this.currentTime}s`);
                }
            } catch (error) {
                console.warn('⚠️ No se pudo establecer el tiempo de reproducción:', error);
            }
        }
        
        // Intentar reproducir
        try {
            currentAudio.volume = this.volume;
            await currentAudio.play();
            console.log(`🎶 Reproduciendo: ${currentAudio.id} - Tiempo: ${currentAudio.currentTime}s`);
        } catch (error) {
            console.warn('🔇 La reproducción automática fue prevenida:', error);
            
            // Mostrar prompt de reproducción si no hay interacción del usuario
            if (!this.hasUserInteracted) {
                this.showPlayPrompt();
            }
        }
    }
    
    showPlayPrompt() {
        // Eliminar prompt existente
        const existingPrompt = document.getElementById('audio-play-prompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }
        
        // Crear nuevo prompt
        const prompt = document.createElement('div');
        prompt.id = 'audio-play-prompt';
        prompt.innerHTML = `
            <div class="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg cursor-pointer z-50 animate-bounce">
                <div class="flex items-center space-x-2">
                    <span class="text-lg">🔔</span>
                    <span class="text-sm font-medium">Click para reproducir música</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        const promptHandler = () => {
            prompt.remove();
            this.hasUserInteracted = true;
            console.log("👆 Prompt de reproducción clickeado - Reproduciendo música");
            this.playCurrentSong();
        };
        
        prompt.addEventListener('click', promptHandler, { once: true });
        
        // Auto-remover después de 15 segundos
        setTimeout(() => {
            if (document.body.contains(prompt)) {
                prompt.remove();
                console.log("🕒 Prompt de reproducción removido por tiempo");
            }
        }, 15000);
        
        console.log("🔔 Mostrando prompt de reproducción");
    }
    
    playNextSong() {
        if (!this.isMusicOn) return;
        
        console.log(`⏭️  Pasando a siguiente canción...`);
        
        const currentAudio = this.audioElements[this.currentSongIndex];
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        
        // Avanzar al siguiente índice
        const previousIndex = this.currentSongIndex;
        this.currentSongIndex = (this.currentSongIndex + 1) % this.audioElements.length;
        this.currentTime = 0; // Reset time for new song
        
        console.log(`🔄 Cambiando canción: ${previousIndex} → ${this.currentSongIndex}`);
        
        this.saveState();
        this.playCurrentSong();
    }
    
    toggleMusic() {
        this.isMusicOn = !this.isMusicOn;
        console.log(`🔊 Música ${this.isMusicOn ? 'ACTIVADA' : 'DESACTIVADA'}`);
        
        this.saveState();
        
        if (this.isMusicOn) {
            this.playCurrentSong();
        } else {
            this.pauseAll();
            this.currentTime = 0;
            localStorage.removeItem('challengeme_current_time');
            console.log("⏹️  Música pausada y tiempo reiniciado");
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
        this.volume = Math.max(0, Math.min(1, volume)); // Clamp entre 0 y 1
        this.audioElements.forEach(audio => {
            if (audio) audio.volume = this.volume;
        });
        this.saveState();
    }
}

// Inicialización automática cuando la página carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("🚀 Inicializando AudioManager...");
        window.audioManager = new AudioManager();
    });
} else {
    console.log("🚀 Inicializando AudioManager (DOM ya listo)...");
    window.audioManager = new AudioManager();
}

// Interceptar navegación para guardar estado
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.startsWith('javascript:') && 
        !link.href.startsWith('#') && link.target !== '_blank') {
        
        console.log("🔗 Navegación detectada - Guardando estado del audio...");
        
        // Guardar estado inmediatamente
        if (window.audioManager) {
            window.audioManager.saveState();
        }
        
        // También guardar después de un pequeño delay por si acaso
        setTimeout(() => {
            if (window.audioManager) {
                window.audioManager.saveState();
            }
        }, 50);
    }
});