const db = require('../config/db');//accedo a mi configuracion de db previamente realizada

const User = {//funcion para un nuevo usuario
    create : async(user) => {
        //user viene con number, email, password y un rol
        const query = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?,?,?,?)';
        const [result] = await db.execute(query, [user.nombre, user.email, user.password, user.rol]);
        return result;
    },

    //funcion para buscar por email
    findByEmail: async(email) =>{
        const query= 'SELECT * FROM usuarios WHERE email = ?';
        const [rows] =  await db.execute(query, [email]);
        return rows[0];
    }
};

module.exports = User;