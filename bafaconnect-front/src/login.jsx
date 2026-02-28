import { useState } from 'react';
import api from './api/axios';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token); // On stocke le token "magique"
      alert("Connexion réussie !");
      onLoginSuccess();
    } catch (err) {
      alert("Erreur de connexion...");
    }
  };

  return (
    <div style={{ border: '1px solid #646cff', padding: '20px', borderRadius: '8px', maxWidth: '300px', margin: '20px auto' }}>
      <h2>Connexion Animateur</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}

export default Login;