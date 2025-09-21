document.addEventListener('DOMContentLoaded', function() {
  const btnYes = document.getElementById('btnYes');
  const btnNo = document.getElementById('btnNo');
  const termsCheckbox = document.getElementById('termsCheckbox');
  const termsLink = document.getElementById('termsLink');
  const privacyLink = document.getElementById('privacyLink');
  const toast = document.getElementById('toast');

  // Función para mostrar toast
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // Habilitar/deshabilitar botones según el checkbox
  termsCheckbox.addEventListener('change', function() {
    const enabled = this.checked;
    btnYes.disabled = !enabled;
    btnNo.disabled = !enabled;

    btnYes.classList.toggle('opacity-50', !enabled);
    btnNo.classList.toggle('opacity-50', !enabled);
  });

  // Enlaces
  termsLink.addEventListener('click', function(e) {
    e.preventDefault();
    showToast("Aquí se mostrarían los Términos y Condiciones completos.");
  });

termsLink.addEventListener('click', function(e) {
  // abrir en una nueva pestaña
  window.open("/Terms_conditions.html", "_blank");
});

  // Botón Sí
  btnYes.addEventListener('click', function() {
    if (!termsCheckbox.checked) {
      showToast("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }
    localStorage.setItem('challengeme_age_verified', 'adult');
    localStorage.setItem('challengeme_terms_accepted', 'true');
    window.location.href = "/Principal.html";
  });

  // Botón No
  btnNo.addEventListener('click', function() {
    if (!termsCheckbox.checked) {
      showToast("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }
    localStorage.setItem('challengeme_age_verified', 'minor');
    localStorage.setItem('challengeme_terms_accepted', 'true');
    window.location.href = "/Principal.html";
  });

  // Ripple effect
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (this.disabled) return;
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');

      const rect = btn.getBoundingClientRect();
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';

      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Estilos dinámicos
  const style = document.createElement('style');
  style.textContent = `
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
    .btn:disabled:hover {
      transform: none !important;
    }
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      opacity: 0.9;
      z-index: 1000;
    }
    .hidden { display: none; }
    .ripple-effect {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.6);
      transform: scale(0);
      animation: ripple 0.6s linear;
      width: 100px;
      height: 100px;
      pointer-events: none;
    }
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
});
async function loadCategories() {
    try {
        if (!supabase) {
            throw new Error('Supabase no está inicializado');
        }

        console.log('Cargando categorías desde Supabase...');

        // Verificar edad guardada en localStorage
        const isAdult = localStorage.getItem('challengeme_age_verified') === 'adult';

        // Consulta a la tabla
        let query = supabase.from('categorias').select('*').order('nombre');

        if (!isAdult) {
            // Solo mostrar categorías que no son exclusivas de adultos
            query = query.eq('solo_adultos', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error cargando categorías:', error);
            loadDefaultCategories();
            return;
        }

        if (data && data.length > 0) {
            console.log('Categorías cargadas:', data);
            categories = data;
            populateCategorySelect();
        } else {
            console.log('No se encontraron categorías disponibles');
            loadDefaultCategories();
        }
    } catch (error) {
        console.error('Error inesperado:', error);
        loadDefaultCategories();
    }
}
