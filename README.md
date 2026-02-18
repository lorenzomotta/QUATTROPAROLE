# Quattro Parole

Webapp per raccogliere contributi di 4 parole che vengono concatenati in un testo unico.

## Configurazione

1. **Supabase**: Modifica `services/storageService.ts` con:
   - URL del tuo progetto Supabase
   - Chiave anon public
   - Nome della tabella (default: `parole`)

2. **Password**: Modifica `App.tsx` e imposta `INSERT_PASSWORD` con la password per autorizzare gli inserimenti.

3. **Tabella Supabase**: Crea una tabella con le colonne:
   - `id` (uuid, primary key)
   - `autore` (text)
   - `parola1` (text)
   - `parola2` (text)
   - `parola3` (text)
   - `parola4` (text)
   - `createdAt` (bigint o timestamp)

4. **RLS**: Crea policy su Supabase:
   - SELECT per ruolo `anon` (tutti possono leggere)
   - INSERT per ruolo `anon` (tutti possono inserire, ma l'app richiede password)

## Installazione

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
