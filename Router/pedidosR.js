import express from 'express';
import pedidosController from '../Controllers/pedidoController.js';

const router = express.Router(); //permite crear rutas para manejar las peticiones HTTP relacionadas con los pedidos

router.get('/obtenerTodosLosPedidos', pedidosController.obtenerPedido);
router.get('/obtenerPedidoPorId/:id', pedidosController.obtenerPedidoPorId);
router.get('/obtenerPedidoConDetalleCompleto/:id', pedidosController.obtenerPedidoConDetalleCompleto);
router.post('/crearPedido', pedidosController.crearPedidoN);
router.put('/actualizarEstado', pedidosController.ActualizarEstadoPedido);
router.delete('/eliminarPedido/:id', pedidosController.EliminarPedido);
router.get('/obtenerDetalleProductoEnPedido/:idPedido/:idProducto', pedidosController.ObtenerDetalleProductoEnPedido);
router.get('/obtenerEstadisticas', pedidosController.ObtenerEstadisticas);
router.get('/obtenerPedidosPorEstado/:estado', pedidosController.obtenerPedidoPorEstado);
router.get('/filtrarPedidosPorFecha/:desde/:hasta', pedidosController.filtrarPedidosPorFecha);
router.get('/obtenerResumenDeProductosEnPedido/:id', pedidosController.obtenerResumenDeProductosEnPedido);
router.post('/api/pedidos/:id/productos', pedidosController.agregarProductosAPedido);
router.delete('/api/pedidos/:id/productos/:idProducto', pedidosController.eliminarProductoDePedido);

export default router;