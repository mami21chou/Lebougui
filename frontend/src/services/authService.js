import API from './api';

export class AuthService {
  // Inscription
  static async inscription(formData) {
    const payload = {
      telephone: formData.telephone,
      code_pin: formData.code_pin,
      nom: formData.nom,
      prenom: formData.prenom,
      adresse: formData.adresse,
      role: formData.role,
    };

    if (formData.role === 'livreur') {
      payload.type_vehicule = formData.type_vehicule;
      payload.immatriculation = formData.immatriculation;
      payload.est_frigorifie = formData.est_frigorifie;
    }

    const response = await API.post('/auth/inscription/', payload);
    return response.data;
  }

  // Connexion Utilisateurs (Pêcheur, Livreur, Acheteur)
  static async connexionUtilisateur(telephone, codePin) {
    const response = await API.post('/auth/connexion/', {
      identifiant: telephone,
      mot_de_passe: codePin,
    });
    return response.data;
  }

  // Connexion Admin (utilise la même endpoint que les utilisateurs)
  // Le backend détecte automatiquement que c'est un admin via l'email
  static async connexionAdmin(email, password) {
    const response = await API.post('/auth/connexion/', {
      identifiant: email,
      mot_de_passe: password,
    });
    return response.data;
  }
}