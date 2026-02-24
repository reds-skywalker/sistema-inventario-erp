// src/controllers/productController.js
const Product = require('../models/productModel');

exports.obtenerProductos = async (req, res) => {
    try {
        // Capturar variables de la URL
        let { page = 1, limit = 10, marca = '' } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        //  Llamar al modelo pasándole los parámetros
        const resultado = await Product.getAll({ limit, offset, marca });

        //  Calcular el total de páginas
        const totalPages = Math.ceil(resultado.total / limit);

        //  Enviar respuesta estructurada (JSON Avanzado)
        res.status(200).json({
            info: {
                totalItems: resultado.total,
                totalPages: totalPages,
                currentPage: page,
                limit: limit
            },
            data: resultado.rows 
        });

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
        // reporte de base de datos 
        const reporte = await Product.getInventoryReport();

        let tipoCambioUSD = null;
        try {
            // API pública de tipos de cambio 
            const apiRes = await fetch('https://open.er-api.com/v6/latest/MXN');
            const data = await apiRes.json();
            tipoCambioUSD = data.rates.USD; 
        } catch (apiError) {
            console.error('⚠️ No se pudo conectar a la API de divisas:', apiError.message);
            // manejo de errores
        }

        // suma total de dinero 
        const totalValorMXN = reporte.reduce((suma, item) => suma + Number(item.valor_inventario), 0);
        
        // Hacemos la conversión a Dólares 
        const totalValorUSD = tipoCambioUSD ? (totalValorMXN * tipoCambioUSD).toFixed(2) : null;

        // Enviamos la respuesta 
        res.status(200).json({
            resumen_financiero: {
                moneda_base: 'MXN',
                valor_total_mxn: totalValorMXN,
                valor_total_usd: totalValorUSD,
                tasa_conversion_usd: tipoCambioUSD
            },
            detalle_productos: reporte
        });

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