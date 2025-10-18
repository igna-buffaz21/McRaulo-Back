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

async function calcularPrecioProductoPersonalizado(idProducto, ingredientesPersonalizados) {
    // Validaciones básicas
    if (!idProducto) {
        throw new Error('ID del producto es requerido');
    }
    
    // Obtener información del producto base
    const producto = await productosAD.obtenerProductoPorId(idProducto);
    
    if (producto.length === 0) {
        throw new Error(`No se encontró el producto con ID ${idProducto}`);
    }
    
    let precioTotal = producto[0].precio_base;
    const detallePrecios = [{
        concepto: 'Precio base',
        precio: producto[0].precio_base
    }];
    
    // Calcular precios de ingredientes extras
    if (ingredientesPersonalizados && ingredientesPersonalizados.length > 0) {
        for (const ingrediente of ingredientesPersonalizados) {
            // Validar que el ingrediente tenga los campos necesarios
            if (!ingrediente.id_ingrediente) {
                throw new Error('ID del ingrediente es requerido');
            }
            
            if (ingrediente.es_extra) {
                const ingredienteInfo = await productosAD.obtenerIngredientePorId(ingrediente.id_ingrediente);
                
                if (ingredienteInfo.length === 0) {
                    throw new Error(`No se encontró el ingrediente con ID ${ingrediente.id_ingrediente}`);
                }
                
                // Validar cantidad
                const cantidad = ingrediente.cantidad || 1;
                if (cantidad <= 0) {
                    throw new Error('La cantidad debe ser mayor a 0');
                }
                
                const costoExtra = ingredienteInfo[0].precio * cantidad;
                precioTotal += costoExtra;
                
                detallePrecios.push({
                    concepto: `Extra ${ingredienteInfo[0].nombre} (${cantidad} ${ingredienteInfo[0].unidad_medida})`,
                    precio: costoExtra
                });
            }
        }
    }
    
    return {
        producto: producto[0].nombre,
        precio_total: precioTotal,
        detalle_precios: detallePrecios
    };
}

async function obtenerIngredientesParaModificar(id_producto) {
    const producto = await productosAD.obtenerProductoPorId(id_producto);

    if (producto.length === 0) {
        throw new Error(`No se encontró el producto con ID ${id_producto}`);
    }

    const ingredientes = await productosAD.obtenerIngredientesParaModificar(id_producto);

    return ingredientes;

}


export default {
    obtenerProductos,
    obtenerProductoEspecificoConIngredientes,
    obtenerProductoPorCategoria,
    calcularPrecioProductoPersonalizado,
    obtenerIngredientesParaModificar
}


//