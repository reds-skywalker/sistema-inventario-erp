const mysql = require('mysql2');
require('dotenv').config(); //variables de entorno

console.log("Chequeando variables de entorno:");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "****" : "NO EXISTE");
console.log("DB_NAME:", process.env.DB_NAME);
console.log("Intentando conectar a MySQL...");
console.log("Host:", process.env.DB_HOST);
console.log("Port:", process.env.DB_PORT); 
console.log("User:", process.env.DB_USER);


const pool = mysql.createPool({//Variables para conectar mi pool de db
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections : true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
    rejectUnauthorized: false // Esto permite la conexión segura con Aiven
  }
});

const promisePool = pool.promise();

console.log("Intentando conectar a base datos...");

//Codigo de prueba para conectar a la base de datos con una promesa para manejar el error
pool.getConnection((err, connection) => {
    if(err){
        console.error("Error conectandoa  la base de datos: ",err.code);
        console.error("Detalles: ",err.message);
    }
    else {
        console.log("Conexion DB  exitosa");
        connection.release; //Hay que liberar la base de datos despues de lograr la conexion
    }
});

module.exports = promisePool;