// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Middlewares
const authMiddleware = require('../middleware/authMiddleware');
const verificarRol = require('../middleware/roleMiddleware');

// Rutas Públicas (Cualquier empleado logueado)
router.get('/', authMiddleware, productController.obtenerProductos);
router.get('/buscar', authMiddleware, productController.buscarPorNombre);

router.get('/stock', authMiddleware, productController.verInventarioCompleto); 

// Rutas Privadas (SOLO ADMIN)
router.post('/', authMiddleware, verificarRol(['admin']), productController.crearProducto);
router.put('/:id', authMiddleware, verificarRol(['admin']), productController.actualizarProducto);
router.delete('/:id', authMiddleware, verificarRol(['admin']), productController.eliminarProducto);

module.exports = router;