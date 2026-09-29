import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MapPin, Phone, Snowflake, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { validerFormulaire, filtrerSaisie, LONGUEUR_TELEPHONE, LONGUEUR_CODE_PIN, PREFIXES_TELEPHONE_VALIDES } from '../../utils/validators';
import logo from '../../assets/logo-lebougui.jpeg';
import bgImage from '../../assets/hero.png';

export default function Register() {
  const navigate = useNavigate();

  const initialFormState = {
    prenom: '',
    nom: '',
    telephone: '',
    code_pin: '',
    adresse: '',
    role: 'pecheur',
    type_vehicule: 'moto',
    immatriculation: '',
    est_frigorifie: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ═══════════════════════════════════════════════════════════
  // GESTION DES CHAMPS
  // ═══════════════════════════════════════════════════════════
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = type === 'checkbox' ? checked : value;

    // Filtre en temps réel selon le champ
    if (type !== 'checkbox') {
      newValue = filtrerSaisie(name, newValue);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Efface l'erreur du champ dès que l'utilisateur modifie
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    setErrors({});
  };

  // ═══════════════════════════════════════════════════════════
  // SOUMISSION
  // ═══════════════════════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // 1️⃣ Validation locale via validators.js
    const erreurs = validerFormulaire(formData);

    if (Object.keys(erreurs).length > 0) {
      setErrors(erreurs);
      setErrorMsg('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    setLoading(true);

    try {
      const data = await AuthService.inscription(formData);

      setSuccessMsg(data.message || 'Inscription réussie ! Redirection en cours...');
      setFormData(initialFormState);
      setErrors({});

      setTimeout(() => navigate('/connexion'), 2000);
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        const firstErrorKey = Object.keys(data)[0];
        const firstErrorVal = Array.isArray(data[firstErrorKey])
          ? data[firstErrorKey][0]
          : data[firstErrorKey];
        setErrorMsg(`${firstErrorKey.toUpperCase()}: ${firstErrorVal}`);
      } else {
        setErrorMsg('Une erreur est survenue lors de la connexion au serveur.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // COMPOSANTS UTILITAIRES
  // ═══════════════════════════════════════════════════════════
  const FieldError = ({ field }) => {
    if (!errors[field]) return null;
    return (
      <p className="mt-1 text-[10px] text-red-600 font-medium flex items-center gap-1">
        <AlertCircle size={10} />
        {errors[field]}
      </p>
    );
  };

  const inputClass = (field, extra = '') =>
    `w-full px-3 py-2.5 bg-slate-200/60 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'ring-2 ring-red-400 border border-red-400'
        : 'focus:ring-orange-500'
    } ${extra}`;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-slate-950 font-sans text-slate-800">

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/65 to-slate-950/90 backdrop-blur-[2px] z-0" />

      {/* Header */}
      <div className="relative z-10 w-full max-w-md px-4 pt-8 pb-3 flex flex-col items-center">
        <div className="relative mb-2">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur-md opacity-40"></div>
          <div className="relative flex items-center justify-center bg-white/95 p-2.5 rounded-full shadow-2xl border border-white/20">
            <img src={logo} alt="Lebougui Logo" className="h-14 w-14 object-contain rounded-full" />
          </div>
        </div>

        <div className="text-center space-y-0.5">
          <span className="text-xs tracking-widest text-orange-400 uppercase font-black drop-shadow">
            {formData.role === 'livreur' ? 'Espace Livreur' : 'Plateforme Maritime'}
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Lebougui</h1>
        </div>
      </div>

      {/* Formulaire */}
      <div className="relative z-10 w-full max-w-md px-4 pb-10">
        <div className="w-full bg-slate-50/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/30">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              {formData.role === 'livreur' ? 'Inscription Livreur' : 'Inscription'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Rejoignez la communauté Lebougui</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* PRÉNOM + NOM */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-1">Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className={inputClass('prenom')}
                />
                <FieldError field="prenom" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-1">Nom</label>
                <input
                  type="text"
                  name="nom"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={inputClass('nom')}
                />
                <FieldError field="nom" />
              </div>
            </div>

            {/* TÉLÉPHONE */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-1">
                Téléphone <span className="text-slate-400 font-normal normal-case">({LONGUEUR_TELEPHONE} chiffres — {PREFIXES_TELEPHONE_VALIDES.join('/')})</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  name="telephone"
                  placeholder="77 123 45 67"
                  value={formData.telephone}
                  onChange={handleChange}
                  maxLength={LONGUEUR_TELEPHONE}
                  inputMode="numeric"
                  className={inputClass('telephone', 'pl-9')}
                />
              </div>
              <FieldError field="telephone" />
            </div>

            {/* CODE PIN + ADRESSE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-1">
                  Code PIN <span className="text-slate-400 font-normal normal-case">({LONGUEUR_CODE_PIN} chiffres)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    name="code_pin"
                    maxLength={LONGUEUR_CODE_PIN}
                    placeholder="••••"
                    value={formData.code_pin}
                    onChange={handleChange}
                    inputMode="numeric"
                    className={inputClass('code_pin', 'pr-8')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldError field="code_pin" />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-1">Adresse</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin size={16} />
                  </div>
                  <input
                    type="text"
                    name="adresse"
                    placeholder="Ville, Quartier"
                    value={formData.adresse}
                    onChange={handleChange}
                    className={inputClass('adresse', 'pl-8')}
                  />
                </div>
                <FieldError field="adresse" />
              </div>
            </div>

            {/* RÔLE */}
            <div>
              <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase mb-2">Type de profil</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-200/60 p-1 rounded-2xl">
                {[
                  { id: 'pecheur', label: 'Pêcheur' },
                  { id: 'livreur', label: 'Livreur' },
                  { id: 'acheteur', label: 'Acheteur' },
                ].map((roleItem) => (
                  <button
                    key={roleItem.id}
                    type="button"
                    onClick={() => handleRoleSelect(roleItem.id)}
                    className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                      formData.role === roleItem.id
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {roleItem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CHAMPS LIVREUR */}
            {formData.role === 'livreur' && (
              <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-3">
                <label className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase">Véhicule & Immatriculation</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    name="type_vehicule"
                    value={formData.type_vehicule}
                    onChange={handleChange}
                    className="w-full px-2 py-2.5 bg-slate-200/80 text-slate-900 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="moto">Moto / Scooter</option>
                    <option value="voiture">Voiture</option>
                    <option value="camionnette">Camionnette</option>
                    <option value="tricycle">Tricycle</option>
                  </select>

                  <input
                    type="text"
                    name="immatriculation"
                    placeholder="AA-000-BB"
                    value={formData.immatriculation}
                    onChange={handleChange}
                    className={inputClass('immatriculation', 'uppercase text-xs')}
                  />
                </div>
                <FieldError field="immatriculation" />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Snowflake size={16} className="text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Est frigorifié</p>
                      <p className="text-[9px] text-slate-500">Pour les produits frais</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="est_frigorifie"
                      checked={formData.est_frigorifie}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            )}

            {/* BOUTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? 'Inscription en cours...' : "S'inscrire"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600">
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => navigate('/connexion')}
                className="font-bold text-orange-600 hover:underline"
              >
                Se connecter
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}