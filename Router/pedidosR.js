import express from 'express';
import clienteController from '../Controllers/pedidoController.js';

const router = express.Router(); //permite crear rutas para manejar las peticiones HTTP relacionadas con los pedidos

router.get('/obtenerTodosLosPedidos', clienteController.obtenerPedido);
router.get('/obtenerPedidoPorId/:id', clienteController.obtenerPedidoPorId);
router.get('/obtenerPedidoConDetalleCompleto/:id', clienteController.obtenerPedidoConDetalleCompleto);
router.post('/crearPedido', clienteController.crearPedidoN);
router.put('/actualizarEstado', clienteController.ActualizarEstadoPedido);
router.delete('/eliminarPedido/:id', clienteController.EliminarPedido);
router.get('/obtenerDetalleProductoEnPedido/:idPedido/:idProducto', clienteController.ObtenerDetalleProductoEnPedido);
router.get('/obtenerEstadisticas', clienteController.ObtenerEstadisticas);
router.get('/obtenerPedidosPorEstado/:estado', clienteController.obtenerPedidoPorEstado);
router.get('/filtrarPedidosPorFecha/:desde/:hasta', clienteController.filtrarPedidosPorFecha);

export default router;