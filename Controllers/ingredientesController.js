import ingredientesN from '../Negocio/ingredienteN.js';

async function obtenerIngredientes(req, res) {
    try {
        const ingredientes = await ingredientesN.obtenerIngredientes();
        res.status(200).json(ingredientes);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener los ingredientes' });
    }
}

async function obtenerIngredientesPorId(req, res) {
    const id = req.params.id;
    try {
        const ingredientes = await ingredientesN.obtenerIngredientesPorId(id);
        res.status(200).json(ingredientes);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener los ingredientes' + error.message });
    }
}

export default {
    obtenerIngredientes,
    obtenerIngredientesPorId
}
