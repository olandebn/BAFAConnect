import { useState, useEffect } from 'react';
import api from './api/axios';

function OnboardingBanner({ role, onNavigate }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (dismissed) return;
    const key = `onboarding_done_${localStorage.getItem('userId')}`;
    if (localStorage.getItem(key)) return;

    api.get('/profiles/me').then(res => {
      const p = res.data;
      const missing = [];

      if (role === 'animateur') {
        if (!p.nom) missing.push({ label: 'Ajouter votre nom', page: 'profil' });
        if (!p.ville) missing.push({ label: 'Indiquer votre ville', page: 'profil' });
        if (!p.photo_url) missing.push({ label: 'Ajouter une photo de profil', page: 'profil' });
        if (!p.disponibilites || p.disponibilites === '[]') missing.push({ label: 'Renseigner vos disponibilités', page: 'profil' });
      } else {
        if (!p.nom_structure) missing.push({ label: 'Renseigner le nom de votre structure', page: 'profil' });
        if (!p.description) missing.push({ label: 'Ajouter une description', page: 'profil' });
      }

      if (missing.length > 0) {
        setSteps(missing);
        setShow(true);
      }
    }).catch(() => {});
  }, [role, dismissed]);

  const handleDismiss = () => {
    const key = `onboarding_done_${localStorage.getItem('userId')}`;
    localStorage.setItem(key, '1');
    setShow(false);
    setDismissed(true);
  };

  if (!show) return null;

  return (
    <div className="onboarding-banner">
      <div className="onboarding-banner-left">
        <span className="onboarding-banner-icon">👋</span>
        <div>
          <div className="onboarding-banner-title">Bienvenue sur BafaConnect !</div>
          <div className="onboarding-banner-sub">Complétez votre profil pour augmenter vos chances :</div>
        </div>
      </div>
      <div className="onboarding-steps">
        {steps.map((s, i) => (
          <button key={i} className="onboarding-step-chip" onClick={() => { onNavigate(s.page); handleDismiss(); }}>
            {s.label} →
          </button>
        ))}
      </div>
      <button className="onboarding-dismiss" onClick={handleDismiss} title="Ignorer">✕</button>
    </div>
  );
}

export default OnboardingBanner;
