import React, { useState } from 'react';
import { Phone, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { AuthService } from '../../services/authService';
import AuthLayout from '../../components/AuthLayout';

export default function ConnexionPublic() {
  const [telephone, setTelephone] = useState('');
  const [codePin, setCodePin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrorMsg('');

  try {
    const data = await AuthService.connexionUtilisateur(telephone, codePin);

    // Extraction depuis la structure exacte de Django
    const accessToken = data?.tokens?.access;
    const refreshToken = data?.tokens?.refresh;

    if (accessToken) {
      // Enregistrement sous les deux clés pour éviter tout problème de nommage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('token', accessToken);
      
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      // Redirection après succès
      const params = new URLSearchParams(window.location.search);
      const target = params.get('redirect') || '/pecheur/accueil';
      window.location.href = target;
    } else {
      setErrorMsg('Jeton d\'accès non reçu.');
    }
  } catch (err) {
    setErrorMsg('Identifiants incorrects.');
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthLayout badgeText="Espace Utilisateur" title="Connexion">
      <div className="w-full bg-slate-50/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/30">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Bienvenue</h2>
          <p className="text-xs text-slate-500 mt-0.5">Accédez à votre compte Lebougui</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-1">
              Numéro de téléphone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={16} />
              </div>
              <input
                type="tel"
                required
                placeholder="77 ... .. .."
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-200/60 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-1">
              Code PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                maxLength={8}
                minLength={4}
                placeholder="••••"
                value={codePin}
                onChange={(e) => setCodePin(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-200/60 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            <span>{loading ? 'Connexion...' : 'Se connecter'}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            Vous n'avez pas de compte ?{' '}
            <a href="/inscription" className="font-bold text-orange-600 hover:underline">
              S'inscrire
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}