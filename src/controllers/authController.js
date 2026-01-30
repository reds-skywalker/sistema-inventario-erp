const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // 1. Validar que vengan los datos
        if (!nombre || !email || !password) {
            return res.status(400).json({ message: "Por favor llene todos los campos" });
        }

        // 2. Verificar si el usuario ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "El correo ya está registrado" });
        }

        // 3. Encriptar contraseña (Hash)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Guardar en Base de Datos
        const newUser = {
            nombre,
            email,
            password: hashedPassword,
            rol: rol || 'empleado' // Si no envían rol, es empleado por defecto
        };

        await User.create(newUser);

        res.status(201).json({ message: "Usuario registrado exitosamente" });//Respuesta exitosa en la promesa

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

// Función de Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar si el usuario existe
        // db.execute devuelve [rows, fields], por eso uso [users]
        const [users] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' }); // Es buena practica de seguridad no indicar directamente que el email no existe
        }

        const user = users[0]; // El usuario encontrado

        // Comparo la constrasena encriptada de mi DB
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Crear el Token 
        // Incluyo el ID y el ROL en el token para usarlos después
        const token = jwt.sign(
            { id: user.id, rol: user.rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' } // El token expira en 8 horas
        );

        // 4. Enviar respuesta
        res.status(200).json({
            message: 'Login exitoso',
            token: token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
