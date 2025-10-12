document.addEventListener("DOMContentLoaded", () => {
  // ======== MENÚ LATERAL ========
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");

  // Abrir/cerrar menú
  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Cerrar menú al hacer clic fuera
  document.addEventListener("click", (e) => {
    const isMenuButton = menuBtn.contains(e.target);
    const isSidebar = sidebar.contains(e.target);

    if (!isMenuButton && !isSidebar && sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
    }
  });

  // Evitar cierre al hacer clic dentro del sidebar
  sidebar.addEventListener("click", (e) => e.stopPropagation());

  // ======== AJUSTE DE TEXTO DE FONDO (SI EXISTE) ========
  function adjustBackgroundText() {
    const bgText = document.querySelector(".bg-text");
    const bgSub = document.querySelector(".bg-sub");

    if (!bgText || !bgSub) return; // Evita error si no existen
    if (window.innerWidth < 768) {
      bgText.style.fontSize = Math.min(window.innerWidth * 0.15, 96) + "px";
      bgSub.style.fontSize = Math.min(window.innerWidth * 0.05, 24) + "px";
    }
  }

  window.addEventListener("resize", adjustBackgroundText);
  adjustBackgroundText();

  // ======== EFECTO PARALLAX EN LAS CARTAS ========
  function setupCardEffects() {
    const cards = document.querySelectorAll(".game-option-card:not(.locked)");

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        if (window.innerWidth > 768) {
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

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
      });
    });
  }

  setupCardEffects();

  // ======== MODAL DE COMPARTIR ========
  const shareBtn = document.getElementById("shareBtn");
  const shareModal = document.getElementById("shareModal");
  const closeModal = document.getElementById("closeModal");
  const copyLinkBtn = document.getElementById("copyLink");
  const shareOptions = document.querySelectorAll(".share-option");

  // Abrir modal
  if (shareBtn) {
    shareBtn.addEventListener("click", (e) => {
      e.preventDefault();
      shareModal.classList.remove("hidden");
    });
  }

  // Cerrar modal
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      shareModal.classList.add("hidden");
    });
  }

  // Cerrar al hacer clic fuera del modal
  if (shareModal) {
    shareModal.addEventListener("click", (e) => {
      if (e.target === shareModal) {
        shareModal.classList.add("hidden");
      }
    });
  }

  // Copiar enlace
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const currentUrl = window.location.href;

      navigator.clipboard
        .writeText(currentUrl)
        .then(() => {
          const originalHtml = copyLinkBtn.innerHTML;
          copyLinkBtn.innerHTML =
            '<i class="fas fa-check text-2xl mb-2"></i><span>¡Enlace copiado!</span>';
          setTimeout(() => {
            copyLinkBtn.innerHTML = originalHtml;
          }, 2000);
        })
        .catch((err) => {
          console.error("Error al copiar: ", err);
          alert("No se pudo copiar el enlace. Intenta manualmente: " + currentUrl);
        });
    });
  }

  // Compartir en redes sociales - Versión corregida para Facebook e Instagram
if (shareOptions.length > 0) {
  shareOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      const platform = option.getAttribute("data-platform");
      const currentUrl = encodeURIComponent(window.location.href);
      const text = encodeURIComponent("¡Mira este increíble juego ChallengeMe!");
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      let shareUrl;

      switch (platform) {
        case "facebook":
          // Siempre abrir Messenger (web o app)
          if (isMobile) {
            // Para móvil: intentar abrir app de Messenger
            shareUrl = `fb-messenger://share?link=${currentUrl}`;
            window.location.href = shareUrl;
            
            // Fallback: abrir Messenger web
            setTimeout(() => {
              if (!document.hidden) {
                shareUrl = `https://www.facebook.com/dialog/send?link=${currentUrl}&redirect_uri=${encodeURIComponent(window.location.href)}`;
                window.open(shareUrl, "_blank");
              }
            }, 500);
          } else {
            // Para escritorio: abrir Messenger web directamente
            shareUrl = `https://www.facebook.com/dialog/send?link=${currentUrl}&redirect_uri=${encodeURIComponent(window.location.href)}`;
            window.open(shareUrl, "_blank", "width=600,height=500");
          }
          break;

        case "X":
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${currentUrl}`;
          window.open(shareUrl, "_blank", "width=600,height=400");
          break;

        case "whatsapp":
          shareUrl = `https://api.whatsapp.com/send?text=${text} ${currentUrl}`;
          window.open(shareUrl, "_blank", "width=600,height=600");
          break;

        case "instagram":
          // Instagram DM - Solo funciona en móvil con la app instalada
          if (isMobile) {
            // Intentar abrir Instagram Direct
            shareUrl = `instagram://direct?text=${text} ${currentUrl}`;
            window.location.href = shareUrl;
            
            // Fallback: mostrar instrucciones
            setTimeout(() => {
              if (!document.hidden) {
                showInstagramShareModal(
                  `Para compartir en Instagram Direct:\n\n1. Abre la app de Instagram\n2. Toca el icono de mensajes (✉️)\n3. Selecciona un contacto o crea un nuevo mensaje\n4. Pega este enlace:\n\n${window.location.href}\n\n5. Envía el mensaje`
                );
              }
            }, 1000);
          } else {
            // En escritorio, mostrar instrucciones
            showInstagramShareModal(
              `Para compartir en Instagram desde tu computadora:\n\n1. Abre Instagram.com\n2. Haz clic en el icono de mensajes (✉️)\n3. Selecciona un contacto o crea un nuevo mensaje\n4. Pega este enlace:\n\n${window.location.href}\n\n5. Envía el mensaje\n\n💡 También puedes compartirlo en tu historia`
            );
          }
          break;

        case "gmail":
          shareUrl = `mailto:?subject=ChallengeMe - Juego divertido&body=${text} ${currentUrl}`;
          window.location.href = shareUrl;
          break;

        default:
          return;
      }
    });
  });
}

// Función para mostrar modal de Instagram (mejorada)
function showInstagramShareModal(message) {
  // Cerrar modal existente si hay uno
  const existingModal = document.querySelector('.instagram-share-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }

  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'instagram-share-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D);
    color: white;
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    border: 2px solid rgba(255,255,255,0.2);
  `;
  
  modalContent.innerHTML = `
    <div style="margin-bottom: 20px;">
      <i class="fab fa-instagram" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
      <h3 style="margin: 0 0 15px 0; font-size: 1.5rem; font-weight: 600;">Compartir en Instagram</h3>
    </div>
    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
      <p style="margin: 0; line-height: 1.5; font-size: 0.95rem;">${message.replace(/\n/g, '<br>')}</p>
    </div>
    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
      <button id="copy-instagram-link" style="background: white; color: #E1306C; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease;">
        <i class="fas fa-copy" style="margin-right: 8px;"></i>Copiar Enlace
      </button>
      <button id="close-instagram-modal" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease;">
        <i class="fas fa-times" style="margin-right: 8px;"></i>Cerrar
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Efectos hover para botones
  const copyBtn = document.getElementById('copy-instagram-link');
  const closeBtn = document.getElementById('close-instagram-modal');
  
  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.transform = 'translateY(-2px)';
    copyBtn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
  });
  
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.transform = 'translateY(0)';
    copyBtn.style.boxShadow = 'none';
  });
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.transform = 'translateY(-2px)';
    closeBtn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
  });
  
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.transform = 'translateY(0)';
    closeBtn.style.boxShadow = 'none';
  });
  
  // Copiar enlace
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i>¡Copiado!';
      copyBtn.style.background = '#00ff99';
      copyBtn.style.color = '#000';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalHtml;
        copyBtn.style.background = 'white';
        copyBtn.style.color = '#E1306C';
      }, 2000);
    }).catch((err) => {
      console.error('Error al copiar: ', err);
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i>¡Copiado!';
      copyBtn.style.background = '#00ff99';
      copyBtn.style.color = '#000';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalHtml;
        copyBtn.style.background = 'white';
        copyBtn.style.color = '#E1306C';
      }, 2000);
    });
  });
  
  // Cerrar modal
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Cerrar modal al hacer click fuera o presionar ESC
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
    }
  });
}

  // ======== BOTÓN DE VERIFICACIÓN DE EDAD ========
  const ageVerifyBtn = document.getElementById("ageVerifyBtn");
  if (ageVerifyBtn) {
    ageVerifyBtn.addEventListener("click", () => {
      window.location.href = "./index.html";
    });
  }
});
