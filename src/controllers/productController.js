// src/controllers/productController.js
const Product = require('../models/productModel');

exports.obtenerProductos = async (req, res) => {
    try {
        const productos = await Product.getAll();
        res.status(200).json(productos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};

exports.crearProducto = async (req, res) => {
    try {
        const { nombre, marca, sku, imagen_url } = req.body;

        // Validación básica
        if (!nombre) {
            return res.status(400).json({ message: 'El nombre del producto es obligatorio' });
        }

        const nuevoId = await Product.create({ nombre, marca, sku, imagen_url });

        res.status(201).json({
            message: 'Producto creado en el catálogo',
            producto_id: nuevoId,
            datos: { nombre, marca, sku }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el producto' });
    }
};

//Para implementar la funcion buscar por nombre
exports.buscarPorNombre = async (req, res) => {
    try {
        // Vamos a esperar algo como: /api/productos/buscar?q=Taladro
        const { q } = req.query; 

        if (!q) {
            return res.status(400).json({ message: 'Por favor ingresa un nombre para buscar' });
        }

        const productos = await Product.searchByName(q);
        
        if (productos.length === 0) {
            return res.status(404).json({ message: 'No se encontraron productos con ese nombre' });
        }

        res.status(200).json(productos);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al buscar el producto' });
    }


};

exports.verInventarioCompleto = async (req, res) => {
    try {
        const reporte = await Product.getInventoryReport();
        res.status(200).json(reporte);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar el reporte de inventario' });
    }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params; // Viene de la URL: /api/productos/5
        const { nombre, marca, sku, imagen_url } = req.body;

        // Llamamos al modelo
        const result = await Product.update(id, { nombre, marca, sku, imagen_url });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto actualizado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar' });
    }
};

// Eliminar producto (Lógico)
exports.eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Product.softDelete(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado (archivado) correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar' });
    }
};