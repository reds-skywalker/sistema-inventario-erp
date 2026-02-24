// tests/api.test.js
const request = require('supertest');
const app = require('../src/app'); // Importamos servidor sin encenderlo

describe('Pruebas de Seguridad y Autenticación', () => {
    
    //  Validar que el login rebote a los hackers
    it('Debería denegar el acceso con credenciales falsas (Error 401)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'hacker@falso.com',
                password: 'passwordEquivocada'
            });

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message', 'Credenciales inválidas');
    });

    //  Validar que las rutas estén protegidas por el Middleware de Token
    it('Debería bloquear la petición a productos si no se envía un Token (Error 401)', async () => {
        const res = await request(app).get('/api/productos');

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message'); // Solo verificamos que envíe un mensaje de error
    });

});