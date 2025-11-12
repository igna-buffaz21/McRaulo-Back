import pedidosAD from '../AccesoDatos/pedidosAD.js';
import clienteAD from '../AccesoDatos/pedidosAD.js';
import { ESTADOS_PAGO, ESTADOS_PEDIDO } from '../config/const.js';

async function obtenerPedidoPendienteDePago(id_pedido) {

  const response = await pedidosAD.obtenerPedidoPendienteDePago(id_pedido);

  return response;
  
}

async function CrearPagoEfectivo(id_pedido) {
  
  const response = await pedidosAD.CrearPagoEfectivo(ESTADOS_PAGO.APROBADO, id_pedido);

  const response2 = await pedidosAD.actualizarEstadoPago(id_pedido, ESTADOS_PEDIDO.PENDIENTE)

  return response;

}

async function obtenerPedidosPendientes() {
  const response = await pedidosAD.obtenerPedidosPendientes()

  return response;
}

async function cambiarEstadoPedido(id_pedido, estado) {
  
  if (
    estado != ESTADOS_PEDIDO.PENDIENTE_PAGO 
    && estado != ESTADOS_PEDIDO.PENDIENTE 
    && estado != ESTADOS_PEDIDO.LISTO
    && estado != ESTADOS_PEDIDO.EN_PREPARACION 
    && estado != ESTADOS_PEDIDO.ENTREGADO
  ) {
    throw new Error("Estado no valido"); 
  }

  const response = await pedidosAD.actualizarEstadoPago(id_pedido, estado);

  return response;
}

async function obtenerPedidosPreparacion() {
  const response = await pedidosAD.obtenerPedidosPreparacion()

  return response;
}

async function obtenerDetallePedido(id_pedido) {
  const response = await pedidosAD.obtenerDetallePedido(id_pedido);

  return response;
}

async function obtenerPedidosListos() {
  const response = await pedidosAD.obtenerPedidosListos()

  return response;
}

export default {
  obtenerPedidoPendienteDePago,
  CrearPagoEfectivo,
  obtenerPedidosPendientes,
  cambiarEstadoPedido,
  obtenerPedidosPreparacion,
  obtenerDetallePedido,
  obtenerPedidosListos
};