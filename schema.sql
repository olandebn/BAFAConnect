-- TABLE UTILISATEURS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('animateur', 'directeur')) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PROFIL ANIMATEUR
CREATE TABLE animateurs_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    age INTEGER,
    ville TEXT,
    diplomes TEXT[],
    competences TEXT[],
    experiences TEXT[],
    disponibilites JSON
);

-- PROFIL DIRECTEUR / STRUCTURE
CREATE TABLE structures_directeurs (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nom_structure TEXT NOT NULL,
    type_structure TEXT,
    ville TEXT,
    description TEXT
);

-- TABLE DES SEJOURS
CREATE TABLE sejours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directeur_id UUID REFERENCES users(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    type TEXT,
    lieu TEXT,
    date_debut DATE,
    date_fin DATE,
    description TEXT,
    nombre_postes INTEGER
);

-- TABLE DES CANDIDATURES
CREATE TABLE candidatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
    animateur_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_candidature TIMESTAMP DEFAULT NOW(),
    statut TEXT CHECK (statut IN ('en attente', 'acceptee', 'refusee')) DEFAULT 'en attente'
);

-- TABLE DES MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediteur_id UUID REFERENCES users(id) ON DELETE CASCADE,
    destinataire_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contenu TEXT NOT NULL,
    envoye_le TIMESTAMP DEFAULT NOW(),
    lu BOOLEAN DEFAULT FALSE
);
