import { useState } from 'react';
import api from './api/axios';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // AJOUT DU BLOC TRY ICI
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // On stocke les informations essentielles dans le navigateur
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role); // On stocke le rôle (animateur ou directeur)
      
      alert("Connexion réussie !");
      onLoginSuccess(res.data.role); // On prévient App.jsx du rôle de l'utilisateur
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion : vérifiez vos identifiants.");
    }
  };

  return (
    <div style={{ border: '1px solid #646cff', padding: '20px', borderRadius: '8px', maxWidth: '300px', margin: '20px auto', background: '#242424' }}>
      <h2 style={{ color: 'white' }}>Connexion BAFA Connect</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        <input 
          type="password" 
          placeholder="Mot de passe" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        <button type="submit" style={{ background: '#646cff', color: 'white', cursor: 'pointer', padding: '10px' }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}

export default Login;