// ------------------------
// CONFIGURACIÓN SUPABASE
// ------------------------
const supabaseUrl = "https://yymhkhpxeeaqvstdjjlr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bWhraHB4ZWVhcXZzdGRqamxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjY1NjgsImV4cCI6MjA3MTQwMjU2OH0.IR8sISA9HXYRB_FsxuyKwYp0n_YCEojLN3lcdhdXSMQ";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ------------------------
// ELEMENTOS DEL DOM
// ------------------------
const acceptTermsCheckbox = document.getElementById("acceptTerms");
const loginGoogleBtn = document.getElementById("loginGoogle");
const birthDateInput = document.getElementById("birthDate");

// ------------------------
// LOGIN CON GOOGLE Y GUARDAR FECHA
// ------------------------
loginGoogleBtn.addEventListener("click", async () => {
    if (!acceptTermsCheckbox.checked) {
        alert("Debes aceptar los términos y condiciones.");
        return;
    }

    const birthDate = birthDateInput.value;
    if (!birthDate) {
        alert("Debes ingresar tu fecha de nacimiento.");
        return;
    }

    try {
        localStorage.setItem('tempBirthDate', birthDate);

        // Redirige de vuelta a index.html después del login
        const { error: loginError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });

        if (loginError) {
            alert("Error al iniciar sesión: " + loginError.message);
            localStorage.removeItem('tempBirthDate');
        }
    } catch (err) {
        console.error("Error inesperado:", err);
        localStorage.removeItem('tempBirthDate');
        alert("Error inesperado al iniciar sesión");
    }
});

// ------------------------
// VERIFICAR SESIÓN AL CARGAR Y ACTUALIZAR PERFIL
// ------------------------
window.addEventListener("load", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await handleUserSession(session);

    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) await handleUserSession(session);
    });
});

async function handleUserSession(session) {
    const user = session.user;
    const tempBirthDate = localStorage.getItem('tempBirthDate');

    // Verifica que user.id sea un UUID válido
    if (!user || !user.id) {
        alert("No se pudo obtener el usuario autenticado.");
        return;
    }

    // Busca el perfil
    const { data: perfil, error: fetchError } = await supabase
        .from("profiles")
        .select("birthdate")
        .eq("id", user.id)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error revisando perfil:", fetchError.message);
        return;
    }

    if (!perfil && tempBirthDate) {
        // Log para depuración
        console.log("Insertando perfil:", { id: user.id, birthdate: tempBirthDate });

        // Inserta o actualiza el perfil
        const { error: insertError } = await supabase.from("profiles").upsert({
            id: user.id,
            birthdate: tempBirthDate
        });

        if (insertError) {
            console.error("Error guardando perfil:", insertError.message);
            alert("Error guardando perfil: " + insertError.message);
            return;
        }

        localStorage.removeItem('tempBirthDate');

        if (!validateAge(tempBirthDate)) {
            alert("Debes ser mayor de 18 años.");
            await supabase.auth.signOut();
            return;
        }

        alert("Perfil guardado correctamente. Bienvenido, " + user.email);
        window.location.href = "Principal.html"; // Redirige solo después del insert

    } else if (perfil) {
        if (!validateAge(perfil.birthdate)) {
            alert("Debes ser mayor de 18 años.");
            await supabase.auth.signOut();
            return;
        }
        alert("Bienvenido de nuevo, " + user.email);
        window.location.href = "Principal.html";
    }
}

function validateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
}