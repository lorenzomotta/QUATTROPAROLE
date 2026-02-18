import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Parola } from '../types';

// Configurazione Supabase
const SUPABASE_URL = "https://ijvyypnqfbmqpeevxvqr.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqdnl5cG5xZmJtcXBlZXZ4dnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjE3MDksImV4cCI6MjA4Njk5NzcwOX0.xyFz60CEa9qcEdhliQErIXhu3IUJS3a55HR5JqzSQWg";

const isConfigured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes("INSERISCI_QUI");

let supabase: SupabaseClient | null = null;
if (isConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn("Configurazione Supabase non valida.");
  }
}

const LOCAL_KEY = 'quattro_parole_local_db';

// Supabase/PostgreSQL spesso usa snake_case. Mappa riga DB -> Parola
type RowStoria = {
  id: string;
  autore: string;
  parola1: string;
  parola2: string;
  parola3: string;
  parola4: string;
  created_at?: number;
  createdat?: number; // se il DB ha tutto minuscolo
};

function rowToParola(row: RowStoria): Parola {
  const createdAt = row.created_at ?? row.createdat ?? 0;
  return {
    id: row.id,
    autore: row.autore,
    parola1: row.parola1,
    parola2: row.parola2,
    parola3: row.parola3,
    parola4: row.parola4,
    createdAt: typeof createdAt === 'number' ? createdAt : Number(createdAt),
  };
}

export const storageService = {
  isCloudConnected: () => isConfigured && supabase !== null,

  getParole: async (): Promise<Parola[]> => {
    if (supabase) {
      // Prova prima con "storia" (minuscolo, standard PostgreSQL)
      // Se non funziona, prova con "STORIA" (maiuscolo)
      const tableNames = ['storia', 'STORIA'];
      
      for (const tableName of tableNames) {
        let result = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: true });
        
        // Se errore con order, prova senza order
        if (result.error && (result.error.code === 'PGRST204' || String(result.error.message).includes('400'))) {
          result = await supabase.from(tableName).select('*');
        }
        
        if (!result.error && result.data && Array.isArray(result.data)) {
          const parole = (result.data as RowStoria[]).map(rowToParola);
          return parole.sort((a, b) => a.createdAt - b.createdAt);
        }
        
        // Se errore 404/table not found, prova il prossimo nome
        if (result.error && (result.error.code === 'PGRST116' || result.error.message?.includes('not find the table'))) {
          continue; // Prova il prossimo nome tabella
        }
        
        // Se altro errore, logga e continua
        if (result.error) {
          console.warn(`Errore con tabella "${tableName}":`, result.error.message);
        }
      }
      
      console.error('Nessuna tabella trovata. Usando localStorage.');
    }

    const localData = localStorage.getItem(LOCAL_KEY);
    const parole: Parola[] = localData ? JSON.parse(localData) : [];
    return parole.sort((a, b) => a.createdAt - b.createdAt);
  },

  saveParola: async (parola: Omit<Parola, 'id' | 'createdAt'>): Promise<void> => {
    if (supabase) {
      const now = Date.now();
      const base = {
        autore: parola.autore,
        parola1: parola.parola1,
        parola2: parola.parola2,
        parola3: parola.parola3,
        parola4: parola.parola4,
      };
      
      // Prova prima con "storia" (minuscolo), poi con "STORIA" (maiuscolo)
      const tableNames = ['storia', 'STORIA'];
      
      for (const tableName of tableNames) {
        // Prova prima con created_at (snake_case, standard Supabase)
        let result = await supabase.from(tableName).insert([{ ...base, created_at: now }]);
        
        // Se errore con created_at, prova con createdAt (camelCase)
        if (result.error && (result.error.code === 'PGRST204' || String(result.error.message).includes('400'))) {
          result = await supabase.from(tableName).insert([{ ...base, createdAt: now }]);
        }
        
        if (!result.error) {
          return; // Salvataggio riuscito
        }
        
        // Se errore 404/table not found, prova il prossimo nome
        if (result.error && (result.error.code === 'PGRST116' || result.error.message?.includes('not find the table'))) {
          continue; // Prova il prossimo nome tabella
        }
        
        // Se altro errore, logga e continua
        if (result.error) {
          console.warn(`Errore con tabella "${tableName}":`, result.error.message);
        }
      }
      
      console.error('Nessuna tabella trovata. Salvando su localStorage.');
    }

    const localData = localStorage.getItem(LOCAL_KEY);
    const parole: Parola[] = localData ? JSON.parse(localData) : [];
    const newParola: Parola = {
      ...parola,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify([...parole, newParola]));
  },
};
