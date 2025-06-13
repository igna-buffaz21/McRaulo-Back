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

export default {
    obtenerProductos,
    obtenerProductoEspecificoConIngredientes,
    obtenerProductoPorCategoria
}