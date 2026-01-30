// src/models/loteModel.js
const pool = require('../config/db');

const Lote = {

    // --- FUNCIONES DE LECTURA (Las que faltaban) ---

    // 1. Obtener todos los lotes (Para la lista principal)
    getAll: async () => {
        const query = `
            SELECT id, nombre, fecha_compra, costo_compra, valor_referencia_total, estado,
            -- Calculamos visualmente el factor (evitando división por cero con NULLIF)
            (costo_compra / NULLIF(valor_referencia_total, 0)) as factor
            FROM lotes 
            ORDER BY fecha_compra DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    },

    // 2. Obtener los productos DENTRO de un lote (Para la mesa de trabajo)
    getLoteDetails: async (loteId) => {
        const query = `
            SELECT 
                dl.id, 
                p.nombre as producto_nombre, 
                p.imagen_url,
                dl.cantidad_inicial, 
                dl.cantidad_disponible, 
                dl.precio_referencia,
                dl.costo_unitario, -- Este es el dato clave que se recalcula
                dl.observaciones
            FROM detalle_lotes dl
            JOIN productos p ON dl.producto_id = p.id
            WHERE dl.lote_id = ?
        `;
        const [rows] = await pool.execute(query, [loteId]);
        return rows;
    },

    // --- FUNCIONES DE ESCRITURA (Las que ya tenías) ---

    // 3. CREAR CABECERA (Paso 1: Solo nombre y costo total)
    createHeader: async (data) => {
        const { nombre, fecha_compra, costo_compra } = data;
        const query = `INSERT INTO lotes (nombre, fecha_compra, costo_compra) VALUES (?, ?, ?)`;
        const [result] = await pool.execute(query, [nombre, fecha_compra, costo_compra]);
        return result.insertId;
    },

    // 4. AGREGAR PRODUCTO Y RECALCULAR TODO (Paso 2: Dinámico)
    addProduct: async (loteId, item) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // A. Insertar el producto en detalle_lotes
            // Nota: Insertamos costo_unitario en 0 temporalmente, abajo lo corregimos
            await connection.execute(
                `INSERT INTO detalle_lotes 
                (lote_id, producto_id, cantidad_inicial, cantidad_disponible, precio_referencia, observaciones, costo_unitario) 
                VALUES (?, ?, ?, ?, ?, ?, 0)`,
                [loteId, item.producto_id, item.cantidad, item.cantidad, item.precio_referencia, item.observaciones]
            );

            // B. Actualizar el Total de Referencia del Lote (Sumar lo nuevo)
            const valorReferenciaItem = item.cantidad * item.precio_referencia;
            await connection.execute(
                `UPDATE lotes 
                 SET valor_referencia_total = valor_referencia_total + ? 
                 WHERE id = ?`,
                [valorReferenciaItem, loteId]
            );

            // C. ¡EL PASO CLAVE! Recalcular costos unitarios
            // Como el 'factor_costo' en la tabla 'lotes' se actualizó solo (es columna calculada),
            // ahora debemos actualizar el 'costo_unitario' de TODOS los items de este lote
            
            await connection.execute(`
                UPDATE detalle_lotes dl
                JOIN lotes l ON dl.lote_id = l.id
                SET dl.costo_unitario = dl.precio_referencia * l.factor_costo
                WHERE dl.lote_id = ?
            `, [loteId]);

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // 5. REMOVER PRODUCTO Y RECALCULAR (La inversa de agregar)
    removeProduct: async (loteId, detalleId) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // A. Obtener datos del item antes de borrarlo (necesitamos saber cuánto valía para restar)
            const [rows] = await connection.execute(
                'SELECT cantidad_inicial, precio_referencia FROM detalle_lotes WHERE id = ? AND lote_id = ?',
                [detalleId, loteId]
            );

            if (rows.length === 0) {
                throw new Error('El producto no existe en este lote');
            }

            const item = rows[0];
            const valorARestar = item.cantidad_inicial * item.precio_referencia;

            // B. Borrar el item
            await connection.execute(
                'DELETE FROM detalle_lotes WHERE id = ?',
                [detalleId]
            );

            // C. Actualizar Cabecera del Lote (Restar valor)
            // Usamos GREATEST(0, ...) para evitar negativos por error de redondeo
            await connection.execute(
                `UPDATE lotes 
                 SET valor_referencia_total = GREATEST(0, valor_referencia_total - ?) 
                 WHERE id = ?`,
                [valorARestar, loteId]
            );

            // D. RECALCULAR COSTOS de los sobrevivientes
            // Al cambiar el valor_referencia_total, el factor_costo (columna generada) cambia solo.
            // Solo necesitamos propagar ese nuevo factor a los items restantes.
            await connection.execute(`
                UPDATE detalle_lotes dl
                JOIN lotes l ON dl.lote_id = l.id
                SET dl.costo_unitario = dl.precio_referencia * IFNULL(l.factor_costo, 0)
                WHERE dl.lote_id = ?
            `, [loteId]);

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

};

module.exports = Lote;