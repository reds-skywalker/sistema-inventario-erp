const errorHandler = (err, req, res, next) => {
    //  Imprimimos el error real en la terminal
    console.error('🚨 ERROR INTERNO ATRAPADO:', err.stack);

    //respuesta segura al usuario 
    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
        message: 'Ocurrió un error inesperado en el servidor.',
        detalle: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
    });
};

module.exports = errorHandler;