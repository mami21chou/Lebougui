import React, { useState } from 'react';
import API from '../../services/api'; // Utilise ton instance API configurée

export default function CapturePublication() {
  const [audioBlob, setAudioBlob] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Méthode de soumission pour enregistrer la prise
  const handleEnregistrerPrise = async () => {
    if (!audioBlob && !photoFile) {
      setMessage('Veuillez ajouter un enregistrement audio ou une photo.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();

      // Envoi du fichier audio (vocal)
      if (audioBlob) {
        formData.append('audio', audioBlob, 'vocal_publication.webm');
      }

      // Envoi du fichier photo
      if (photoFile) {
        formData.append('photo', photoFile, 'capture_publication.jpg');
      }

      // Appel de l'API Django
      const response = await API.post('/publications/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Publication enregistrée avec succès !');
      // Optionnel : Réinitialiser ou rediriger vers la liste des publications
      window.location.href = '/pecheur/mes-publications';

    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      if (error.response?.status === 401) {
        setMessage("Session expirée. Reconnectez-vous.");
      } else {
        setMessage("Échec de l'enregistrement de la prise.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Conteneur de tes boutons d'enregistrement Audio et Photo */}

      {message && (
        <div className="p-3 bg-slate-100 text-xs font-bold text-center rounded-xl">
          {message}
        </div>
      )}

      <button
        onClick={handleEnregistrerPrise}
        disabled={loading}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? 'Enregistrement en cours...' : 'Valider et enregistrer la prise'}
      </button>
    </div>
  );
}