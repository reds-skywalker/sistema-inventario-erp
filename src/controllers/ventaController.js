
const Venta = require('../models/ventaModel');

exports.crearVenta = async (req, res) => {
    try {
        const { productos } = req.body; // Array de productos a vender
        const userId = req.user.id; // Lo obtenemos del Token (Middleware)

        if (!productos || productos.length === 0) {
            return res.status(400).json({ message: 'El carrito de venta está vacío' });
        }

        const ventaId = await Venta.create(userId, productos);

        res.status(201).json({
            message: 'Venta registrada con éxito',
            venta_id: ventaId
        });

    } catch (error) {
        console.error(error);
        // Si el error es por falta de stock, enviamos 400, si no 500
        if (error.message.includes('No hay suficiente stock')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al procesar la venta' });
    }
};

exports.obtenerHistorial = async (req, res) => {
    try {
        const ventas = await Venta.getAll();
        res.json(ventas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener ventas' });
    }
};


exports.obtenerDetalleVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const detalles = await Venta.getDetalles(id);
        res.json(detalles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener detalles' });
    }
};