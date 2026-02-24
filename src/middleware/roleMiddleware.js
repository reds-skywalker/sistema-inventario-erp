const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        // verificar que tengamos la informacion del ususario incluyendo el rol
        if (!req.user || !req.user.rol) {
            return res.status(403).json({ 
                message: 'Acceso denegado: No se pudo identificar el rol del usuario.' 
            });
        }

        // comprobamos que el rol exista
        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ 
                message: `Acceso denegado: Esta acción requiere privilegios de ${rolesPermitidos.join(' o ')}.` 
            });
        }

        // Birndamos acceso
        next();
    };
};

module.exports = verificarRol;