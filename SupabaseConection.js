// ------------------------
// CLIENTE SUPABASE (Singleton)
// ------------------------

class SupabaseClient {
    constructor() {
        if (SupabaseClient.instance) {
            return SupabaseClient.instance;
        }
        
        this.SUPABASE_URL = "https://yymhkhpxeeaqvstdjjlr.supabase.co";
        this.SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bWhraHB4ZWVhcXZzdGRqamxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjY1NjgsImV4cCI6MjA3MTQwMjU2OH0.IR8sISA9HXYRB_FsxuyKwYp0n_YCEojLN3lcdhdXSMQ";
        
        this.client = null;
        this.isInitialized = false;
        
        SupabaseClient.instance = this;
    }

    // Inicializar el cliente Supabase
    init() {
        if (this.isInitialized) {
            return this.client;
        }

        try {
            if (typeof window.supabase === 'undefined') {
                console.error('Error: La biblioteca de Supabase no está cargada');
                return null;
            }
            
            this.client = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
            this.isInitialized = true;
            console.log('Supabase inicializado correctamente');
            return this.client;
        } catch (error) {
            console.error('Error inicializando Supabase:', error);
            return null;
        }
    }

    // Obtener la instancia del cliente
    getClient() {
        if (!this.isInitialized) {
            return this.init();
        }
        return this.client;
    }

    // Verificar si está inicializado
    isReady() {
        return this.isInitialized && this.client !== null;
    }

    // Método estático para obtener la instancia fácilmente
    static getInstance() {
        if (!SupabaseClient.instance) {
            new SupabaseClient().init();
        }
        return SupabaseClient.instance;
    }
}

// 🔹 CORRECCIÓN: Crear instancia global y asignarla a window
window.supabaseClient = new SupabaseClient();

// Inicializar inmediatamente
window.supabaseClient.init();

console.log('SupabaseConnection.js cargado correctamente');


export function getSupabaseClient() {
    return window.supabaseClient.getClient();
}