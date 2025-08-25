import productosN from "../Negocio/productosN.js";

async function obtenerProductos(req, res) {
    try {
        const productos = await productosN.obtenerProductos();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
}

async function obtenerProductoEspecificoConIngredientes(req, res) {
    const id = req.params.id;
    try {
        const producto = await productosN.obtenerProductoEspecificoConIngredientes(id);
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto específico' });
    }
}

async function obtenerProductoPorCategoria(req, res) {
    const categoria = req.params.categoria;
    try {
        const productos = await productosN.obtenerProductoPorCategoria(categoria);
        res.status(200).json(productos);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos por categoría' });
    }
}

async function calcularPrecioProductoPersonalizado(req, res) {
    try {
        const { id } = req.params;
        const { ingredientes_personalizados } = req.body;
        
        const resultado = await productosN.calcularPrecioProductoPersonalizado(id, ingredientes_personalizados);
        
        res.status(200).json({
            status: 'OK',
            data: resultado
        });
    } catch (error) {
        console.error(`Error al calcular precio del producto:`, error);
        
        // Determinar código de estado según el tipo de error
        let statusCode = 500;
        if (error.message.includes('no existe') || error.message.includes('No se encontró')) {
            statusCode = 404;
        } else if (error.message.includes('requerido') || error.message.includes('debe ser mayor')) {
            statusCode = 400;
        }
        
        res.status(statusCode).json({
            status: 'ERROR',
            message: error.message
        });
    }
}

export default {
    obtenerProductos,
    obtenerProductoEspecificoConIngredientes,
    obtenerProductoPorCategoria,
    calcularPrecioProductoPersonalizado
}