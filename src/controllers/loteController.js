// src/controllers/loteController.js
const Lote = require('../models/loteModel');

// 1. OBTENER TODOS LOS LOTES (Para la lista)
exports.obtenerLotes = async (req, res) => {
    try {
        const lotes = await Lote.getAll();
        res.json(lotes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener lotes' });
    }
};

// 2. OBTENER DETALLES DE UN LOTE (Para la mesa de trabajo)
exports.obtenerDetalleLote = async (req, res) => {
    try {
        const { id } = req.params;
        const detalles = await Lote.getLoteDetails(id);
        res.json(detalles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener detalles del lote' });
    }
};

// 3. CREAR LOTE (Solo cabecera)
exports.crearLote = async (req, res) => {
    try {
        const { nombre, fecha_compra, costo_compra } = req.body;

        if (!nombre || !costo_compra) {
            return res.status(400).json({ message: 'Nombre y Costo son obligatorios' });
        }

        const loteId = await Lote.createHeader({ nombre, fecha_compra, costo_compra });

        res.status(201).json({
            message: 'Lote iniciado',
            lote_id: loteId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el lote' });
    }
};

// 4. AGREGAR PRODUCTO AL LOTE
exports.agregarProducto = async (req, res) => {
    try {
        const { id } = req.params; // ID del Lote
        const { producto_id, cantidad, precio_referencia, observaciones } = req.body;

        await Lote.addProduct(id, { producto_id, cantidad, precio_referencia, observaciones });

        res.status(200).json({ message: 'Producto agregado y costos recalculados' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al agregar producto al lote' });
    }
};

exports.eliminarProducto = async (req, res) => {
    try {
        const { id, detalleId } = req.params; // id = loteId, detalleId = id de la fila
        await Lote.removeProduct(id, detalleId);
        res.status(200).json({ message: 'Producto eliminado y costos recalculados' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar producto' });
    }
};