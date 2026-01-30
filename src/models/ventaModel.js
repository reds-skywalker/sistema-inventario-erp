// src/models/ventaModel.js
const pool = require('../config/db');

const Venta = {
    
    // 1. CREAR VENTA (Tu lógica FIFO Robusta)
    create: async (userId, productosVenta) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // A. Calcular total
            let totalVenta = 0;
            productosVenta.forEach(p => {
                totalVenta += p.cantidad * p.precio_venta;
            });

            // B. Insertar Cabecera de Venta
            // Nota: Asumimos que la columna de fecha es 'created_at' automática
            const [ventaResult] = await connection.execute(
                'INSERT INTO ventas (usuario_id, total_venta) VALUES (?, ?)',
                [userId, totalVenta]
            );
            const ventaId = ventaResult.insertId;
            console.log('✅ Venta ID creada:', ventaId);

            // C. PROCESAR CADA PRODUCTO (Lógica FIFO)
            for (const item of productosVenta) {
                // Buscar lotes con stock > 0 ordenados por antigüedad (FIFO)
                const [lotes] = await connection.execute(
                    `SELECT id, cantidad_disponible, costo_unitario 
                     FROM detalle_lotes 
                     WHERE producto_id = ? AND cantidad_disponible > 0 
                     ORDER BY id ASC`, 
                    [item.producto_id]
                );

                // Validar stock total
                const stockTotal = lotes.reduce((acc, l) => acc + l.cantidad_disponible, 0);
                if (stockTotal < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ID: ${item.producto_id}`);
                }

                let cantidadRestante = item.cantidad;

                // Descontar de los lotes
                for (const lote of lotes) {
                    if (cantidadRestante <= 0) break;

                    const tomar = Math.min(cantidadRestante, lote.cantidad_disponible);

                    // Actualizar Lote (Restar Stock)
                    await connection.execute(
                        'UPDATE detalle_lotes SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?',
                        [tomar, lote.id]
                    );

                    // Insertar Detalle Venta (Vinculando qué lote se vendió)
                    await connection.execute(
                        `INSERT INTO detalle_ventas 
                        (venta_id, detalle_lote_id, cantidad, precio_venta_final) 
                        VALUES (?, ?, ?, ?)`,
                        [ventaId, lote.id, tomar, item.precio_venta]
                    );

                    cantidadRestante -= tomar;
                }
            }

            await connection.commit();
            return ventaId;

        } catch (error) {
            console.log('❌ ERROR EN VENTA (ROLLBACK):', error.message);
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // --- NUEVAS FUNCIONES PARA EL REPORTE ---

    // 2. OBTENER HISTORIAL DE VENTAS
    getAll: async () => {
        // Seleccionamos 'total_venta' y lo renombramos 'total' para que el frontend lo entienda
        // Seleccionamos 'created_at' y lo renombramos 'fecha'
        const query = `
            SELECT id, created_at as fecha, total_venta as total 
            FROM ventas 
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    },

    // 3. OBTENER DETALLES DE UNA VENTA ESPECÍFICA
    getDetalles: async (ventaId) => {
        // Hacemos JOIN para traer el nombre del producto y el costo original del lote
        const query = `
            SELECT 
                p.nombre as producto,
                p.sku,
                dv.cantidad,
                dv.precio_venta_final as precio_venta,
                dl.costo_unitario -- Esto nos servirá para calcular ganancia real
            FROM detalle_ventas dv
            JOIN detalle_lotes dl ON dv.detalle_lote_id = dl.id
            JOIN productos p ON dl.producto_id = p.id
            WHERE dv.venta_id = ?
        `;
        const [rows] = await pool.execute(query, [ventaId]);
        return rows;
    }
};

module.exports = Venta;