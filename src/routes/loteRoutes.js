// src/routes/loteRoutes.js
const express = require('express');
const router = express.Router();
const loteController = require('../controllers/loteController');
const authMiddleware = require('../middleware/authMiddleware');

// RUTAS GET (Lectura)
router.get('/', authMiddleware, loteController.obtenerLotes);       // Lista de lotes
router.get('/:id', authMiddleware, loteController.obtenerDetalleLote); // Detalles de un lote

// RUTAS POST (Escritura)
router.post('/', authMiddleware, loteController.crearLote);         // Crear Lote nuevo
router.post('/:id/productos', authMiddleware, loteController.agregarProducto); // Agregar item

router.delete('/:id/productos/:detalleId', authMiddleware, loteController.eliminarProducto);

module.exports = router;