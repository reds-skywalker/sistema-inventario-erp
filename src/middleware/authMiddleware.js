const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Leer el token del header
    const token = req.header('Authorization');

    // 2. Si no hay token, denegar acceso
    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No hay token.' });
    }

    try {
        // 3. Verificar el token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next(); // Token válido, puede pasar
    } catch (error) {
        res.status(400).json({ message: 'Token no válido' });
    }
};