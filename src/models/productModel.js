const db = require('../config/db');

const Product = {
    // Obtener todos los productos

     getAll: async ({ limit = 10, offset = 0, marca = '' }) => {
        let query = 'SELECT * FROM productos WHERE activo = true';
        let params = [];

        // 2. Agregar filtro dinámico
        if (marca) {
            query += ' AND marca = ?';
            params.push(marca);
        }

        // 3. Obtener el total exacto de registros
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countRows] = await db.execute(countQuery, params);
        const total = countRows[0].total;

        // 4. CORRECCIÓN: Inyectamos los números directamente en el string 
        // para evitar el error de parseo del driver de MySQL con los signos (?)
        query += ` ORDER BY creado_en DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
        
        const [rows] = await db.execute(query, params);
        
        return { total, rows };
    },

    // Crear un nuevo producto base (sin stock todavía)
    create: async (product) => {
        const { nombre, marca, sku, imagen_url } = product;
        const query = `
            INSERT INTO productos (nombre, marca, sku, imagen_url)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [nombre, marca, sku, imagen_url]);
        return result.insertId; // Retornamos el ID del nuevo producto
    },

    // Buscar por ID (útil para validaciones futuras)
    findById: async (id) => {
        const query = 'SELECT * FROM productos WHERE id = ?';
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    },

    searchByName: async (termino) => {
        const query = 'SELECT * FROM productos WHERE nombre LIKE ? AND activo = true';
        // Los signos % significan "cualquier cosa antes o después"
        const [rows] = await db.execute(query, [`%${termino}%`]);
        return rows;
    },

    getInventoryReport: async () => {
        const query = `
            SELECT 
                p.id, 
                p.nombre, p.marca,
                p.sku, 
                p.imagen_url,
                -- Sumamos lo disponible en todos los lotes para este producto
                COALESCE(SUM(dl.cantidad_disponible), 0) as stock_total,
                -- Opcional: Calculamos cuánto dinero tenemos invertido en ese stock
                COALESCE(SUM(dl.cantidad_disponible * dl.costo_unitario), 0) as valor_inventario
            FROM productos p
            LEFT JOIN detalle_lotes dl ON p.id = dl.producto_id
            WHERE p.activo = true
            GROUP BY p.id
            ORDER BY stock_total DESC; -- Mostrar primero lo que más tenemos
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    // UPDATE: Modificar datos básicos (Nombre, Precio Ref, etc.)
    update: async (id, data) => {
        const { nombre, marca, sku, imagen_url } = data;
        const query = `
            UPDATE productos 
            SET nombre = ?, marca = ?, sku = ?, imagen_url = ?
            WHERE id = ?
        `;
        // result.affectedRows nos dirá si funcionó
        const [result] = await db.execute(query, [nombre, marca, sku, imagen_url, id]);
        return result;
    },

    // DELETE LÓGICO: Solo lo marcamos como inactivo
    softDelete: async (id) => {
        const query = 'UPDATE productos SET activo = false WHERE id = ?';
        const [result] = await db.execute(query, [id]);
        return result;
    }

};

module.exports = Product;