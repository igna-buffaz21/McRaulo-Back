import paymentController from '../Controllers/paymentController.js';
import express from 'express';

const router = express.Router(); //permite crear rutas para manejar las peticiones HTTP relacionadas con los pedidos

router.post('/crearOrden', paymentController.crearOrden); 
router.post('/webhook', paymentController.webhook)

export default router; // Exporta el router para que pueda ser utilizado en otros archivos