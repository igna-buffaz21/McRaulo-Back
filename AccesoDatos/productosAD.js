import sql from '../config/db.js';  // Importar la conexión

async function obtenerProductos() {
    try {
        const result = await sql`
        SELECT * FROM productos 
        WHERE disponible = true
        ORDER BY nombre;
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
    SELECT pib2.cantidad, i.id_ingrediente, i.nombre, i.descripcion, 
            i.precio, i.unidad_medida, i.add, i.remove
      FROM productos_ingrediente_base pib2 
      JOIN ingredientes i ON pib2.id_ingrediente = i.id_ingrediente
      WHERE pib2.id_producto = ${id}
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

async function obtenerProductoPorId(id) {
    try {
        const result = await sql`
            SELECT * FROM productos
            WHERE id_producto = ${id} AND disponible = TRUE;
        `;
        return result;
    } catch (error) {
        throw new Error('Error al obtener el producto: ' + error.message);
    }
}

async function obtenerIngredientePorId(idIngrediente) {
    try {
        const result = await sql`
            SELECT * FROM ingredientes
            WHERE id_ingrediente = ${idIngrediente};
        `;
        return result;
    } catch (error) {
        throw new Error('Error al obtener el ingrediente: ' + error.message);
    }
}

async function caluclarPrecioYDisponibilidad(items) {
    try {
      if (!items?.length) return [];
  
      const ids = items.map(i => i.id_producto);
  
      const productos = await sql`
        WITH lista AS (
          SELECT unnest(${ids}::int[]) AS id_producto   -- 👈 casteo directo en SQL
        )
        SELECT p.id_producto, p.precio_base, p.disponible
        FROM lista v
        JOIN LATERAL (
          SELECT id_producto, precio_base, disponible
          FROM productos
          WHERE productos.id_producto = v.id_producto
        ) p ON TRUE;
      `;
  
      return productos;
  
    } catch (error) {
      console.error("❌ Error al obtener los productos:", error);
      throw error;
    }
  }
  
  
  
  
  

///hola

export default {
    obtenerProductos,
    obtenerProductoEspecificoConIngredientes,
    obtenerProductoPorCategoria,
    obtenerProductoPorId,
    obtenerIngredientePorId,
    caluclarPrecioYDisponibilidad
}
