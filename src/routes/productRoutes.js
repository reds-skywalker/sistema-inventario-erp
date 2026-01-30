// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware'); // Asegúrate que la ruta sea correcta

// Ruta pública (cualquiera puede ver qué vendemos)
router.get('/', productController.obtenerProductos);
router.get('/buscar', productController.buscarPorNombre);

router.get('/stock', authMiddleware, productController.verInventarioCompleto);

// Ruta protegida (solo usuarios con Token pueden crear)
// El authMiddleware va en medio
router.post('/', authMiddleware, productController.crearProducto);

router.put('/:id', authMiddleware, productController.actualizarProducto);
router.delete('/:id', authMiddleware, productController.eliminarProducto);

module.exports = router;