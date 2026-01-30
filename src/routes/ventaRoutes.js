
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const authMiddleware = require('../middleware/authMiddleware');

// Solo usuarios registrados pueden vender
router.post('/', authMiddleware, ventaController.crearVenta);

router.get('/', authMiddleware, ventaController.obtenerHistorial);
router.get('/:id', authMiddleware, ventaController.obtenerDetalleVenta);

module.exports = router;