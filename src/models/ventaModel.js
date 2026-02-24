const pool = require('../config/db');

const Venta = {
    
    // 1. CREAR VENTA (Lógica FIFO Robusta)
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
            const [ventaResult] = await connection.execute(
                'INSERT INTO ventas (usuario_id, total_venta) VALUES (?, ?)',
                [userId, totalVenta]
            );
            const ventaId = ventaResult.insertId;
            console.log('✅ Venta ID creada:', ventaId);

            // C. PROCESAR CADA PRODUCTO (Lógica FIFO)
            for (const item of productosVenta) {
                const [lotes] = await connection.execute(
                    `SELECT id, cantidad_disponible, costo_unitario 
                     FROM detalle_lotes 
                     WHERE producto_id = ? AND cantidad_disponible > 0 
                     ORDER BY id ASC`, 
                    [item.producto_id]
                );

                const stockTotal = lotes.reduce((acc, l) => acc + l.cantidad_disponible, 0);
                if (stockTotal < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ID: ${item.producto_id}`);
                }

                let cantidadRestante = item.cantidad;

                for (const lote of lotes) {
                    if (cantidadRestante <= 0) break;

                    const tomar = Math.min(cantidadRestante, lote.cantidad_disponible);

                    await connection.execute(
                        'UPDATE detalle_lotes SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?',
                        [tomar, lote.id]
                    );

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



    // 2. OBTENER HISTORIAL DE VENTAS
   getAll: async () => {
    // Usamos 'fecha_venta as fecha' para que el JS reciba el nombre que espera
    const query = `
        SELECT id, fecha_venta as fecha, total_venta as total 
        FROM ventas 
        ORDER BY fecha_venta DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
},
    // 3. OBTENER DETALLES DE UNA VENTA ESPECÍFICA
    getDetalles: async (ventaId) => {
        const query = `
            SELECT 
                p.nombre as producto,
                p.sku,
                dv.cantidad,
                dv.precio_venta_final as precio_venta,
                dl.costo_unitario 
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