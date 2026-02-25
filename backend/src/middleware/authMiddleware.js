import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    // 1. Récupérer le header d'autorisation
    const authHeader = req.headers['authorization'];
    
    // Le header est généralement sous la forme "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Si aucun token n'est fourni, on bloque l'accès
    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
    }

    // 3. On vérifie si le token est valide
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // On stocke les infos de l'utilisateur (id et role) dans "req.user"
        req.user = decoded;
        
        // On passe à la suite
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token invalide ou expiré.' });
    }
};