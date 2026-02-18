import React, { useState, useEffect, useCallback } from 'react';
import { Parola } from './types';
import { storageService } from './services/storageService';

// TODO: Imposta la password per autorizzare l'inserimento
const INSERT_PASSWORD = 'VALHALLA';

const App: React.FC = () => {
  const [parole, setParole] = useState<Parola[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [autore, setAutore] = useState('');
  const [parola1, setParola1] = useState('');
  const [parola2, setParola2] = useState('');
  const [parola3, setParola3] = useState('');
  const [parola4, setParola4] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await storageService.getParole();
    setParole(data);
    setIsCloud(storageService.isCloudConnected());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShowAddForm = () => {
    setShowPasswordModal(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === INSERT_PASSWORD) {
      setShowPasswordModal(false);
      setShowAddForm(true);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Password errata.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autore.trim() || !parola1.trim() || !parola2.trim() || !parola3.trim() || !parola4.trim()) {
      return;
    }

    await storageService.saveParola({
      autore: autore.trim(),
      parola1: parola1.trim(),
      parola2: parola2.trim(),
      parola3: parola3.trim(),
      parola4: parola4.trim(),
    });

    // Reset form
    setAutore('');
    setParola1('');
    setParola2('');
    setParola3('');
    setParola4('');
    setShowAddForm(false);
    
    await loadData();
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setAutore('');
    setParola1('');
    setParola2('');
    setParola3('');
    setParola4('');
  };

  // Funzione per validare l'input: una parola + al massimo un segno di punteggiatura
  const validateParolaInput = (value: string): boolean => {
    // Se il campo è vuoto, permetto (per poter cancellare)
    if (value.trim() === '') return true;
    
    // Definisco i segni di punteggiatura comuni
    const punteggiatura = /[.,;:!?\-()[\]{}"'`]/g;
    
    // Conto quanti segni di punteggiatura ci sono
    const matches = value.match(punteggiatura);
    const countPunteggiatura = matches ? matches.length : 0;
    
    // Se ci sono più di un segno di punteggiatura, non è valido
    if (countPunteggiatura > 1) return false;
    
    // Rimuovo i segni di punteggiatura per controllare che il resto sia una parola valida
    const senzaPunteggiatura = value.replace(punteggiatura, '');
    
    // Controllo che il resto contenga solo lettere e numeri (una sola parola, senza spazi)
    const parolaValida = /^[a-zA-Z0-9À-ÿ]*$/.test(senzaPunteggiatura);
    
    return parolaValida;
  };

  // Handler per gestire l'input delle parole con validazione
  const handleParolaChange = (value: string, setter: (value: string) => void) => {
    if (validateParolaInput(value)) {
      setter(value);
    }
  };

  // Costruisce la concatenazione di tutte le parole
  const getConcatenatedText = () => {
    if (parole.length === 0) return '';
    return parole.map(p => `${p.parola1} ${p.parola2} ${p.parola3} ${p.parola4}`).join(' ');
  };

  return (
    <div className="min-h-screen pb-12 bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 min-h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 sm:p-2 rounded-lg shadow-md flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight truncate">QUATTRO PAROLE</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wide hidden sm:block">
                {parole.length} {parole.length === 1 ? 'contributo' : 'contributi'}
                {parole.length > 0 && (
                  <span className="normal-case ml-1.5 text-gray-600">
                    • Ultimo: <span className="font-semibold text-gray-700">{parole[parole.length - 1].autore}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
            <span className={`text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-black uppercase flex-shrink-0 ${isCloud ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isCloud ? 'Cloud' : 'Local'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 mt-0 sm:mt-6">
        <div className="space-y-6">
          {/* Visualizzazione concatenazione */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Testo Completo
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
              <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-medium min-h-[60px]">
                {loading ? (
                  <span className="text-gray-400 italic">Caricamento...</span>
                ) : getConcatenatedText() || (
                  <span className="text-gray-400 italic">Nessun contributo ancora. Sii il primo!</span>
                )}
              </p>
            </div>
          </div>

          {/* Form inserimento */}
          {showAddForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Aggiungi le Tue 4 Parole
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Autore</label>
                  <input
                    type="text"
                    required
                    value={autore}
                    onChange={(e) => setAutore(e.target.value)}
                    placeholder="Il tuo nome"
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 sm:p-2 text-base sm:text-sm touch-manipulation min-h-[44px] sm:min-h-0"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parola 1</label>
                    <input
                      type="text"
                      required
                      value={parola1}
                      onChange={(e) => handleParolaChange(e.target.value, setParola1)}
                      placeholder="Parola 1"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 sm:p-2 text-base sm:text-sm touch-manipulation min-h-[44px] sm:min-h-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parola 2</label>
                    <input
                      type="text"
                      required
                      value={parola2}
                      onChange={(e) => handleParolaChange(e.target.value, setParola2)}
                      placeholder="Parola 2"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 sm:p-2 text-base sm:text-sm touch-manipulation min-h-[44px] sm:min-h-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parola 3</label>
                    <input
                      type="text"
                      required
                      value={parola3}
                      onChange={(e) => handleParolaChange(e.target.value, setParola3)}
                      placeholder="Parola 3"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 sm:p-2 text-base sm:text-sm touch-manipulation min-h-[44px] sm:min-h-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parola 4</label>
                    <input
                      type="text"
                      required
                      value={parola4}
                      onChange={(e) => handleParolaChange(e.target.value, setParola4)}
                      placeholder="Parola 4"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 sm:p-2 text-base sm:text-sm touch-manipulation min-h-[44px] sm:min-h-0"
                    />
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3 sm:py-2.5 px-4 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation min-h-[48px] sm:min-h-0"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 sm:py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all touch-manipulation min-h-[48px] sm:min-h-0"
                  >
                    Conferma Inserimento
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pulsante AGGIUNGI */}
          {!showAddForm && (
            <div className="flex justify-center">
              <button
                onClick={handleShowAddForm}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 sm:py-3 px-8 sm:px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 touch-manipulation min-h-[56px] sm:min-h-[48px] text-base sm:text-sm"
              >
                AGGIUNGI TUE 4 PAROLE
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Autorizzazione Richiesta</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">Inserisci la password per aggiungere un nuovo contributo.</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 sm:py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base min-h-[48px] touch-manipulation"
              placeholder="Password"
              autoFocus
            />
            {passwordError && <p className="text-red-500 text-xs mb-4 font-bold">{passwordError}</p>}
            <div className="flex gap-3 sm:gap-4">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3.5 sm:py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 touch-manipulation min-h-[48px]">Annulla</button>
              <button type="button" onClick={handlePasswordSubmit} className="flex-1 py-3.5 sm:py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[48px]">Accedi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
