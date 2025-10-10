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

  // Compartir en redes sociales
  if (shareOptions.length > 0) {
    shareOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const platform = option.getAttribute("data-platform");
        const currentUrl = encodeURIComponent(window.location.href);
        const text = encodeURIComponent("¡Mira este increíble juego ChallengeMe!");
        let shareUrl;

        switch (platform) {
          case "facebook":
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
            break;
          case "X":
          case "twitter":
            shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${currentUrl}`;
            break;
          case "whatsapp":
            shareUrl = `https://api.whatsapp.com/send?text=${text} ${currentUrl}`;
            break;
          case "instagram":
            alert(
              "Para compartir en Instagram, copia el enlace y pégalo en tu historia o publicación."
            );
            return;
          case "gmail":
            shareUrl = `mailto:?subject=ChallengeMe - Juego divertido&body=${text} ${currentUrl}`;
            break;
          default:
            return;
        }

        window.open(shareUrl, "_blank", "width=600,height=400");
      });
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
