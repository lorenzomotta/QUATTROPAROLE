import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Parola } from '../types';

// Configurazione Supabase
const SUPABASE_URL = "https://ghhalunaiqtyoxryygje.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaGFsdW5haXF0eW94cnl5Z2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTY4NDMsImV4cCI6MjA5NzEzMjg0M30.HUb24RUkqO08LPtAFJTs5MmjnUudx5l6fVCe8vTOcGs";

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
const TABLE_NAMES = ['storia', 'STORIA'];

export type StorageStatus = {
  mode: 'cloud' | 'local';
  cloudOk: boolean;
  cloudError?: string;
};

type RowStoria = {
  id: string;
  autore: string;
  parola1: string;
  parola2: string;
  parola3: string;
  parola4: string;
  created_at?: number;
  createdat?: number;
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

function getLocalParole(): Parola[] {
  const localData = localStorage.getItem(LOCAL_KEY);
  const parole: Parola[] = localData ? JSON.parse(localData) : [];
  return parole.sort((a, b) => a.createdAt - b.createdAt);
}

function saveLocalParole(parole: Parola[]): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(parole));
}

async function fetchFromCloud(): Promise<{ parole: Parola[]; error?: string }> {
  if (!supabase) {
    return { parole: [], error: 'Client Supabase non disponibile.' };
  }

  for (const tableName of TABLE_NAMES) {
    let result = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true });

    if (result.error && (result.error.code === 'PGRST204' || String(result.error.message).includes('400'))) {
      result = await supabase.from(tableName).select('*');
    }

    if (!result.error && result.data && Array.isArray(result.data)) {
      const parole = (result.data as RowStoria[]).map(rowToParola);
      return { parole: parole.sort((a, b) => a.createdAt - b.createdAt) };
    }

    if (result.error && (result.error.code === 'PGRST116' || result.error.message?.includes('not find the table'))) {
      continue;
    }

    if (result.error) {
      return { parole: [], error: result.error.message };
    }
  }

  return { parole: [], error: 'Tabella "storia" non trovata su Supabase. Esegui supabase_setup.sql nel SQL Editor.' };
}

async function insertToCloud(parola: Omit<Parola, 'id' | 'createdAt'>): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    return { ok: false, error: 'Client Supabase non disponibile.' };
  }

  const now = Date.now();
  const base = {
    autore: parola.autore,
    parola1: parola.parola1,
    parola2: parola.parola2,
    parola3: parola.parola3,
    parola4: parola.parola4,
  };

  for (const tableName of TABLE_NAMES) {
    let result = await supabase.from(tableName).insert([{ ...base, created_at: now }]);

    if (result.error && (result.error.code === 'PGRST204' || String(result.error.message).includes('400'))) {
      result = await supabase.from(tableName).insert([{ ...base, createdAt: now }]);
    }

    if (!result.error) {
      return { ok: true };
    }

    if (result.error && (result.error.code === 'PGRST116' || result.error.message?.includes('not find the table'))) {
      continue;
    }

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
  }

  return { ok: false, error: 'Tabella "storia" non trovata su Supabase. Esegui supabase_setup.sql nel SQL Editor.' };
}

async function migrateLocalToCloud(): Promise<void> {
  const localParole = getLocalParole();
  if (localParole.length === 0) return;

  for (const parola of localParole) {
    const result = await insertToCloud({
      autore: parola.autore,
      parola1: parola.parola1,
      parola2: parola.parola2,
      parola3: parola.parola3,
      parola4: parola.parola4,
    });
    if (!result.ok) {
      throw new Error(result.error ?? 'Errore durante la migrazione dei dati locali.');
    }
  }

  localStorage.removeItem(LOCAL_KEY);
}

export const storageService = {
  isConfigured: () => isConfigured && supabase !== null,

  getStorageStatus: async (): Promise<StorageStatus> => {
    if (!isConfigured || !supabase) {
      return { mode: 'local', cloudOk: false };
    }

    const { error } = await fetchFromCloud();
    if (error) {
      return { mode: 'cloud', cloudOk: false, cloudError: error };
    }

    return { mode: 'cloud', cloudOk: true };
  },

  getParole: async (): Promise<Parola[]> => {
    if (supabase) {
      const { parole, error } = await fetchFromCloud();
      if (error) {
        throw new Error(error);
      }

      if (parole.length === 0) {
        const localParole = getLocalParole();
        if (localParole.length > 0) {
          await migrateLocalToCloud();
          const { parole: cloudParole, error: reloadError } = await fetchFromCloud();
          if (reloadError) {
            throw new Error(reloadError);
          }
          return cloudParole;
        }
      }

      return parole;
    }

    return getLocalParole();
  },

  saveParola: async (parola: Omit<Parola, 'id' | 'createdAt'>): Promise<void> => {
    if (supabase) {
      const result = await insertToCloud(parola);
      if (!result.ok) {
        throw new Error(result.error ?? 'Impossibile salvare su Supabase.');
      }
      return;
    }

    const parole = getLocalParole();
    const newParola: Parola = {
      ...parola,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    saveLocalParole([...parole, newParola]);
  },

  hasLocalOnlyData: (): boolean => {
    if (!supabase) return false;
    const localData = localStorage.getItem(LOCAL_KEY);
    if (!localData) return false;
    try {
      const parsed = JSON.parse(localData);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  },
};
