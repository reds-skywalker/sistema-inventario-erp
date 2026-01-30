const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definimos la ruta POST /register que activa la función del controlador
router.post('/register', authController.register);

// Definimos ruta placeholder para login
router.post('/login', authController.login);

module.exports = router;