-- Script per creare/configurare la tabella 'STORIA' su Supabase
-- Esegui questo script nel SQL Editor di Supabase

-- ATTENZIONE: Questo script ELIMINA la tabella esistente e la ricrea
-- Se hai dati importanti, esportali prima!

-- 1. Elimina le policy esistenti (se ci sono)
DROP POLICY IF EXISTS "Chiunque può leggere le parole" ON storia;
DROP POLICY IF EXISTS "Chiunque può inserire nuove parole" ON storia;

-- 2. Elimina la tabella se esiste (con CASCADE per eliminare anche dipendenze)
-- Prova sia con maiuscolo che minuscolo
DROP TABLE IF EXISTS STORIA CASCADE;
DROP TABLE IF EXISTS storia CASCADE;

-- 3. Crea la tabella 'storia' con la struttura corretta (minuscolo, standard PostgreSQL)
-- Usa snake_case per i nomi delle colonne (standard PostgreSQL/Supabase)
CREATE TABLE storia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autore TEXT NOT NULL,
  parola1 TEXT NOT NULL,
  parola2 TEXT NOT NULL,
  parola3 TEXT NOT NULL,
  parola4 TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- 4. Abilita Row Level Security (RLS)
ALTER TABLE storia ENABLE ROW LEVEL SECURITY;

-- 5. Crea policy per permettere a tutti (anon) di leggere i dati
CREATE POLICY "Chiunque può leggere le parole"
ON storia
FOR SELECT
TO anon
USING (true);

-- 6. Crea policy per permettere a tutti (anon) di inserire nuovi dati
CREATE POLICY "Chiunque può inserire nuove parole"
ON storia
FOR INSERT
TO anon
WITH CHECK (true);

-- 7. Crea un indice per migliorare le performance delle query ordinate
CREATE INDEX idx_storia_created_at ON storia(created_at);

-- Verifica che tutto sia stato creato correttamente
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'storia'
ORDER BY ordinal_position;
