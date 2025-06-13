import ingredientesAD from '../AccesoDatos/ingredientesAD.js';

async function obtenerIngredientes() {
    const ingredientes = await ingredientesAD.obtenerIngredientes();
    return ingredientes;
}

async function obtenerIngredientesPorId(id) {
    if (!id) {
        throw new Error('ID de ingrediente no proporcionado');
    }
    const ingredientes = await ingredientesAD.obtenerIngredientesPorId(id);
    return ingredientes;
}

export default {
    obtenerIngredientes,
    obtenerIngredientesPorId
}