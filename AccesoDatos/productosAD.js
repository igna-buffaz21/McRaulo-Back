import sql from '../config/db.js';  // Importar la conexión

async function obtenerProductos() {
    try {
        const result = await sql`
        SELECT * FROM productos 
        WHERE disponible = true
        ORDER BY categoria, nombre;
        `;
        return result;
    } catch (error) {
        throw new Error('Error al obtener los productos: ' + error.message);
    }
}

async function obtenerProductoEspecificoConIngredientes(id) {
    try {
        const producto = await sql`
        SELECT * FROM productos
        WHERE id_producto = ${id};
      `;
      
      if (producto.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const ingredientesBase = await sql`
      SELECT pib.cantidad, i.id_ingrediente, i.nombre, i.descripcion, 
            i.precio, i.unidad_medida
      FROM productos_ingredientes_base pib
      JOIN ingredientes i ON pib.id_ingrediente = i.id_ingrediente
      WHERE pib.id_producto = ${id}
      ORDER BY i.nombre;
    `;

    return{
        ...producto[0],
        ingredientesBase
    }

    }
    catch (error) {
        throw new Error('Error al obtener el producto específico: ' + error.message);
    }
}

async function obtenerProductoPorCategoria(categoria) {
    try {
        const productos = await sql`
        SELECT * FROM productos
        WHERE categoria = ${categoria} AND disponible = TRUE
        ORDER BY nombre;
      `;

      return productos;
    }
    catch (error) {
        throw new Error('Error al obtener los productos por categoría: ' + error.message);
    }
}

export default {
    obtenerProductos,
    obtenerProductoEspecificoConIngredientes,
    obtenerProductoPorCategoria
}