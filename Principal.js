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








// Funcionalidad para control de audio con múltiples canciones y persistencia
document.addEventListener("DOMContentLoaded", function() {
  // Elementos del modal de audio
  const configBtn = document.querySelector('a[href="#"]'); // El enlace de configuración
  const audioModal = document.getElementById("audioModal");
  const closeAudioModal = document.getElementById("closeAudioModal");
  const toggleMusicBtn = document.getElementById("toggleMusic");
  const musicToggleCircle = document.getElementById("musicToggleCircle");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  
  // Elementos de audio para múltiples canciones
  const backgroundMusic1 = document.getElementById("backgroundMusic1");
  const backgroundMusic2 = document.getElementById("backgroundMusic2");
  const backgroundMusic3 = document.getElementById("backgroundMusic3");
  
  // Lista de canciones
  const songs = [backgroundMusic1, backgroundMusic2, backgroundMusic3];
  
  // Usar AudioStateManager para mantener el estado entre vistas
  const audioState = window.audioState || {
    isMusicOn: localStorage.getItem('challengeme_music_enabled') === 'true',
    volume: parseFloat(localStorage.getItem('challengeme_volume')) || 0.5,
    currentSongIndex: parseInt(localStorage.getItem('challengeme_current_song')) || 0,
    saveState: function() {
      localStorage.setItem('challengeme_music_enabled', this.isMusicOn);
      localStorage.setItem('challengeme_volume', this.volume);
      localStorage.setItem('challengeme_current_song', this.currentSongIndex);
    }
  };
  
  let currentSongIndex = audioState.currentSongIndex;
  let isMusicOn = audioState.isMusicOn;
  
  // Configurar el volumen inicial desde el estado guardado
  volumeSlider.value = audioState.volume * 100;
  volumeValue.textContent = `${volumeSlider.value}%`;
  
  // Aplicar volumen a todas las canciones
  songs.forEach(song => {
    song.volume = audioState.volume;
  });
  
  // Configurar event listeners para cuando termina cada canción
  songs.forEach((song, index) => {
    song.addEventListener('ended', function() {
      playNextSong();
    });
  });
  



  // Función para reproducir la siguiente canción
  function playNextSong() {
    if (!isMusicOn) return;
    
    // Detener la canción actual
    songs[currentSongIndex].pause();
    songs[currentSongIndex].currentTime = 0;
    
    // Avanzar al siguiente índice
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    
    // Guardar el índice actual
    audioState.currentSongIndex = currentSongIndex;
    audioState.saveState();
    
    // Reproducir la siguiente canción
    songs[currentSongIndex].play().catch(error => {
      console.log('Error al reproducir la siguiente canción:', error);
      // Si hay error, intentar con la siguiente canción después de un breve delay
      setTimeout(playNextSong, 1000);
    });
  }
  
  // Función para iniciar la reproducción de música
  function startMusicPlayback() {
    if (isMusicOn && songs[currentSongIndex].paused) {
      songs[currentSongIndex].play().catch(error => {
        console.log('La reproducción automática fue prevenida:', error);
        // No mostrar alerta aquí para no interrumpir la experiencia
      });
    }
  }
  
  // Abrir modal de audio al hacer clic en el icono de configuración
  if (configBtn) {
    configBtn.addEventListener("click", (e) => {
      e.preventDefault();
      audioModal.classList.remove("hidden");
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
      isMusicOn = !isMusicOn;
      audioState.isMusicOn = isMusicOn;
      audioState.saveState();
      
      if (isMusicOn) {
        // Encender música - comenzar con la canción actual
        startMusicPlayback();
      } else {
        // Apagar música - pausar todas las canciones
        songs.forEach(song => {
          song.pause();
        });
      }
      
      updateMusicButton();
    });
  }
  
  // Actualizar apariencia del botón de música
  function updateMusicButton() {
    if (isMusicOn) {
      toggleMusicBtn.classList.remove('music-off');
      toggleMusicBtn.classList.add('music-on');
    } else {
      toggleMusicBtn.classList.remove('music-on');
      toggleMusicBtn.classList.add('music-off');
    }
  }
  
  // Controlar volumen
  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      const volume = volumeSlider.value / 100;
      // Aplicar el volumen a todas las canciones
      songs.forEach(song => {
        song.volume = volume;
      });
      volumeValue.textContent = `${volumeSlider.value}%`;
      
      // Guardar estado de volumen
      audioState.volume = volume;
      audioState.saveState();
    });
  }
  
  // Inicializar estado del botón de música
  updateMusicButton();
  
  // Iniciar música si estaba activa al cargar la página
  if (isMusicOn) {
    // Pequeño retraso para asegurar que los elementos de audio estén listos
    setTimeout(() => {
      startMusicPlayback();
    }, 300);
  }
  
  // Permitir que la música se active con cualquier clic en la página
  document.addEventListener('click', function initMusic() {
    if (isMusicOn && songs.every(song => song.paused || song.ended)) {
      startMusicPlayback();
    }
  }, { once: true });
});  



// Funcionalidad para control de audio usando el AudioManager
document.addEventListener("DOMContentLoaded", function() {
    // Elementos del modal de audio
    const configBtn = document.querySelector('a[href="#"]'); // El enlace de configuración
    const audioModal = document.getElementById("audioModal");
    const closeAudioModal = document.getElementById("closeAudioModal");
    const toggleMusicBtn = document.getElementById("toggleMusic");
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeValue = document.getElementById("volumeValue");
    
    // Asegurarse de que el AudioManager esté inicializado
    if (typeof window.audioManager === 'undefined') {
        window.audioManager = new AudioManager();
    }
    
    // Configurar el volumen inicial desde el estado guardado
    if (volumeSlider && volumeValue) {
        volumeSlider.value = window.audioManager.volume * 100;
        volumeValue.textContent = `${volumeSlider.value}%`;
    }
    
    // Abrir modal de audio al hacer clic en el icono de configuración
    if (configBtn) {
        configBtn.addEventListener("click", (e) => {
            e.preventDefault();
            audioModal.classList.remove("hidden");
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
            window.audioManager.toggleMusic();
            updateMusicButton();
        });
    }
    
    // Actualizar apariencia del botón de música
    function updateMusicButton() {
        if (!toggleMusicBtn) return;
        
        if (window.audioManager.isMusicOn) {
            toggleMusicBtn.classList.remove('music-off');
            toggleMusicBtn.classList.add('music-on');
        } else {
            toggleMusicBtn.classList.remove('music-on');
            toggleMusicBtn.classList.add('music-off');
        }
    }
    
    // Controlar volumen
    if (volumeSlider) {
        volumeSlider.addEventListener("input", () => {
            const volume = volumeSlider.value / 100;
            window.audioManager.setVolume(volume);
            volumeValue.textContent = `${volumeSlider.value}%`;
        });
    }
    
    // Inicializar estado del botón de música
    updateMusicButton();
});