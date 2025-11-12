import express from 'express';
import pedidosController from '../Controllers/pedidoController.js';

const router = express.Router(); //permite crear rutas para manejar las peticiones HTTP relacionadas con los pedidos

router.get('/obtenerPedidoPendienteDePago', pedidosController.obtenerPedidoPendienteDePago);
router.post('/CrearPago', pedidosController.CrearPagoEfectivo);
router.get('/obtenerPedidosPendientes', pedidosController.obtenerPedidosPendientes);
router.get('/obtenerPedidosPreparacion', pedidosController.obtenerPedidosPreparacion);
router.get('/cambiarEstadoPedido', pedidosController.cambiarEstadoPedido);
router.get('/obtenerDetallePedido', pedidosController.obtenerDetallePedido);
router.get('/obtenerPedidosListos', pedidosController.obtenerPedidosListos);

export default router;