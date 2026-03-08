import { useState } from 'react';
import api from './api/axios';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // On extrait le rôle depuis l'objet 'user' envoyé par le serveur
      const userRole = res.data.user?.role; 
      const token = res.data.token;

      if (token && userRole) {
        // Stockage propre pour éviter le bug 'undefined'
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole); 
        
        alert("Connexion réussie ! ✅");
        
        // On informe App.jsx pour basculer l'affichage immédiatement
        onLoginSuccess(userRole); 
      } else {
        console.error("Structure de réponse inattendue :", res.data);
        alert("Erreur : Données utilisateur manquantes dans la réponse.");
      }
    } catch (err) {
      console.error("Erreur de connexion :", err);
      alert("Identifiants incorrects ou erreur serveur.");
    }
  };

  return (
    <div style={{ border: '1px solid #646cff', padding: '20px', borderRadius: '8px', maxWidth: '350px', margin: '40px auto', background: '#242424', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
      <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>Connexion BAFA Connect</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <label style={{ color: '#bbb', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Email</label>
          <input 
            type="email" 
            placeholder="votre@email.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#1a1a1a', color: 'white', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ textAlign: 'left' }}>
          <label style={{ color: '#bbb', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Mot de passe</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#1a1a1a', color: 'white', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ background: '#646cff', color: 'white', cursor: 'pointer', padding: '12px', border: 'none', borderRadius: '4px', fontWeight: 'bold', marginTop: '10px', fontSize: '1rem' }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}

export default Login;