document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  
  // Función para abrir/cerrar menú
  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
  
  // Cerrar menú al hacer clic fuera de él
  document.addEventListener("click", (e) => {
    const isMenuButton = menuBtn.contains(e.target);
    const isSidebar = sidebar.contains(e.target);
    
    if (!isMenuButton && !isSidebar && sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
    }
  });
  
  // Prevenir que el menú se cierre al hacer clic dentro de él
  sidebar.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  
  // Ajustar el tamaño del texto de fondo en relación con la ventana
  function adjustBackgroundText() {
    const bgText = document.querySelector('.bg-text');
    const bgSub = document.querySelector('.bg-sub');
    
    if (window.innerWidth < 768) {
      bgText.style.fontSize = Math.min(window.innerWidth * 0.15, 96) + 'px';
      bgSub.style.fontSize = Math.min(window.innerWidth * 0.05, 24) + 'px';
    }
  }
  
  // Efecto de parallax suave para las opciones de juego
  function setupCardEffects() {
    const cards = document.querySelectorAll('.game-option-card:not(.locked)');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        if (window.innerWidth > 768) { // Solo en desktop
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const rotateY = (x - centerX) / 25;
          const rotateX = (centerY - y) / 25;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
      });
    });
  }
  
  // Ejecutar al cargar y al redimensionar
  adjustBackgroundText();
  window.addEventListener('resize', adjustBackgroundText);
  setupCardEffects();
});


// Funcionalidad para compartir (agregar al final del archivo existente)
document.addEventListener("DOMContentLoaded", function() {
  // Elementos del modal de compartir
  const shareBtn = document.getElementById("shareBtn");
  const shareModal = document.getElementById("shareModal");
  const closeModal = document.getElementById("closeModal");
  const copyLinkBtn = document.getElementById("copyLink");
  const shareOptions = document.querySelectorAll(".share-option");
  
  // Abrir modal de compartir
  if (shareBtn) {
    shareBtn.addEventListener("click", (e) => {
      e.preventDefault();
      shareModal.classList.remove("hidden");
    });
  }
  
  // Cerrar modal de compartir
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      shareModal.classList.add("hidden");
    });
  }
  
  // Cerrar modal al hacer clic fuera del contenido
  if (shareModal) {
    shareModal.addEventListener("click", (e) => {
      if (e.target === shareModal) {
        shareModal.classList.add("hidden");
      }
    });
  }
  
  // Copiar enlace al portapapeles
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const currentUrl = window.location.href;
      
      navigator.clipboard.writeText(currentUrl).then(() => {
        // Cambiar temporalmente el texto e icono
        const originalHtml = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = '<i class="fas fa-check text-2xl mb-2"></i><span>¡Enlace copiado!</span>';
        
        // Restaurar después de 2 segundos
        setTimeout(() => {
          copyLinkBtn.innerHTML = originalHtml;
        }, 2000);
      }).catch(err => {
        console.error('Error al copiar: ', err);
        alert('No se pudo copiar el enlace. Intenta manualmente: ' + currentUrl);
      });
    });
  }
  
  // Compartir en redes sociales
  if (shareOptions.length > 0) {
    shareOptions.forEach(option => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const platform = option.getAttribute("data-platform");
        const currentUrl = encodeURIComponent(window.location.href);
        const text = encodeURIComponent("¡Mira este increíble juego ChallengeMe!");
        
        let shareUrl;
        
        switch(platform) {
          case "facebook":
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
            break;
          case "twitter":
            shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${currentUrl}`;
            break;
          case "whatsapp":
            shareUrl = `https://api.whatsapp.com/send?text=${text} ${currentUrl}`;
            break;
          case "instagram":
            // Instagram no permite compartir directamente, abrimos la app
            alert("Para compartir en Instagram, copia el enlace y pégalo en tu historia o publicación.");
            return;
          case "gmail":
            shareUrl = `mailto:?subject=ChallengeMe - Juego divertido&body=${text} ${currentUrl}`;
            break;
          default:
            return;
        }
        
        window.open(shareUrl, '_blank', 'width=600,height=400');
      });
    });
  }
  
});   

// Agregar funcionalidad al botón de verificación de edad
    document.getElementById('ageVerifyBtn').addEventListener('click', function() {
      // Redirigir a la página de verificación de edad
      window.location.href = './index.html';
    });



// audio-context.js - Gestor de audio mejorado
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
        
        console.log("AudioManager inicializado");
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
    
    // Configurar los controles de la interfaz
    setupAudioControls();
});

// Configurar los controles de audio de la interfaz
function setupAudioControls() {
    // Elementos del modal de audio
    const configBtn = document.getElementById('configBtn'); // Usar ID específico
    const audioModal = document.getElementById("audioModal");
    const closeAudioModal = document.getElementById("closeAudioModal");
    const toggleMusicBtn = document.getElementById("toggleMusic");
    const musicToggleCircle = document.getElementById("musicToggleCircle");
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeValue = document.getElementById("volumeValue");
    
    // Configurar el volumen inicial desde el estado guardado
    if (volumeSlider && volumeValue && window.audioManager) {
        volumeSlider.value = window.audioManager.volume * 100;
        volumeValue.textContent = `${volumeSlider.value}%`;
    }
    
    // Abrir modal de audio al hacer clic en el icono de configuración
    if (configBtn) {
        configBtn.addEventListener("click", (e) => {
            e.preventDefault();
            audioModal.classList.remove("hidden");
            updateMusicButton();
        });
    }
    
    // Cerrar modal de audio
    if (closeAudioModal) {
        closeAudioModal.addEventListener("click", () => {
            audioModal.classList.add("hidden");
        });
    }
    
    // Cerrar modal al hacer clic fuera del contenido
    if (audioModal) {
        audioModal.addEventListener("click", (e) => {
            if (e.target === audioModal) {
                audioModal.classList.add("hidden");
            }
        });
    }
    
    // Alternar música
    if (toggleMusicBtn) {
        toggleMusicBtn.addEventListener("click", () => {
            if (window.audioManager) {
                window.audioManager.toggleMusic();
                updateMusicButton();
            }
        });
    }
    
    // Actualizar apariencia del botón de música
    function updateMusicButton() {
        if (!toggleMusicBtn || !window.audioManager) return;
        
        if (window.audioManager.isMusicOn) {
            toggleMusicBtn.classList.add('bg-green-500');
            musicToggleCircle.style.transform = 'translateX(28px)';
        } else {
            toggleMusicBtn.classList.remove('bg-green-500');
            musicToggleCircle.style.transform = 'translateX(0)';
        }
    }
    
    // Controlar volumen
    if (volumeSlider) {
        volumeSlider.addEventListener("input", () => {
            const volume = volumeSlider.value / 100;
            if (window.audioManager) {
                window.audioManager.setVolume(volume);
            }
            volumeValue.textContent = `${volumeSlider.value}%`;
        });
    }
    
    // Inicializar estado del botón de música
    updateMusicButton();
}

// Interceptar navegación para guardar el estado del audio
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href && link.href !== '#' && 
        link.getAttribute('href') && !link.getAttribute('href').startsWith('#')) {
        
        // Guardar el estado actual del audio antes de navegar
        if (window.audioManager && window.audioManager.isMusicOn && 
            window.audioManager.audioElements[window.audioManager.currentSongIndex]) {
            
            window.audioManager.currentTime = 
                window.audioManager.audioElements[window.audioManager.currentSongIndex].currentTime;
            window.audioManager.saveState();
        }
    }
});