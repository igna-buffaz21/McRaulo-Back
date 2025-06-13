import ingredientesController from '../Controllers/ingredientesController.js';
import express from 'express';

const router = express.Router(); //permite crear rutas para manejar las peticiones HTTP relacionadas con los pedidos

router.get('/obtenerIngredientes', ingredientesController.obtenerIngredientes);
router.get('/obtenerIngredientesPorId/:id', ingredientesController.obtenerIngredientesPorId);

export default router; // Exporta el router para que pueda ser utilizado en otros archivos
