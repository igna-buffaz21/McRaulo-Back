import clientesControllers from '../Controllers/clientesControllers.js';
import express from 'express';

const router = express.Router(); //permite crear rutas para manejar las peticiones HTTP relacionadas con los pedidos

router.get('/obtenerTodoslosClientes', clientesControllers.obtenerTodoslosClientes)

export default router; // Exporta el router para que pueda ser utilizado en otros archivos