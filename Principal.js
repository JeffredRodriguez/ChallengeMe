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
 function adjustBackgroundText() {
  const bgText = document.querySelector('.bg-text');
  const bgSub = document.querySelector('.bg-sub');

  // Evitar error si no existen en esta página
  if (!bgText || !bgSub) return;

  if (window.innerWidth < 768) {
    bgText.style.fontSize = Math.min(window.innerWidth * 0.15, 96) + 'px';
    bgSub.style.fontSize = Math.min(window.innerWidth * 0.05, 24) + 'px';
  }
}


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
  });















