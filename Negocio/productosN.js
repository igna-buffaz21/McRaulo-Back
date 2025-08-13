import productosAD from "../AccesoDatos/productosAD.js";

async function obtenerProductos() {
    const productos = await productosAD.obtenerProductos();
    return productos
}

async function obtenerProductoEspecificoConIngredientes(id) {
    const producto = await productosAD.obtenerProductoEspecificoConIngredientes(id);
    return producto;
}

async function obtenerProductoPorCategoria(categoria) {
    if (!categoria) {
        throw new Error('La categoría es requerida');
    }
    const productos = await productosAD.obtenerProductoPorCategoria(categoria);
    return productos;
}


export default {
    obtenerProductos,
    obtenerProductoEspecificoConIngredientes,
    obtenerProductoPorCategoria
}


//