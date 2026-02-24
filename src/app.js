//Traer librerias
const productRoutes = require('./routes/productRoutes');
const express = require('express');
const cors = require ('cors');
const authRoutes = require('./routes/authRoutes');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
//Me permite tomar las variables en mi archivo .env
require('dotenv').config();
require('./config/db'); //Previamente configure mi conexion a db

//Inicializo mis variables de servidor
const app=express();
const PORT = process.env.PORT || 3000;

//Middleware
app.use(cors());//comunicacion entre Frontend y servidor
app.use(express.json());//permite que express entienda los datos que se envien con formato json

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes)
app.use('/api/productos', productRoutes);
app.use('/api/lotes', require('./routes/loteRoutes'));
app.use('/api/ventas', require('./routes/ventaRoutes'));


//endpoints
app.get('/',(req, res) => {
    res.json({
        estado: "exito",
        mensaje: "API full stack",
        verson: "1.0.0"
    });
} );

app.use(errorHandler);
//encender el servidor
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
}

module.exports = app;