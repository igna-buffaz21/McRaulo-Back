import sql from '../config/db.js';  // Importar la conexión

async function obtenerIngredientes() {
    try {
        const ingredientes = await sql`
        SELECT * FROM ingredientes
        WHERE stock > 0
        ORDER BY nombre;
      `;
        return ingredientes;
    }
    catch (error) {
        throw new Error(`Error al obtener los ingredientes: ${error.message}`);
    }
}

async function obtenerIngredientesPorId(id) {
    try {
        const ingrediente = await sql`
        SELECT * FROM ingredientes
        WHERE id_ingrediente = ${id};
      `;
      return ingrediente;
    }
    catch (error) {
        throw new Error(`Error al obtener el ingrediente por ID: ${error.message}`);
    }
}

export default {
    obtenerIngredientes,
    obtenerIngredientesPorId
}