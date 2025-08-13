import pedidosAD from '../AccesoDatos/pedidosAD.js';
import clienteAD from '../AccesoDatos/pedidosAD.js';

async function obtenerPedido() {
        const pedidos = await clienteAD.obtenerPedido();
        return pedidos;
}

async function obtenerPedidoPorId(id) {
    if (!id) {
        throw new Error('ID del pedido es requerido');
    }

    const pedido = await clienteAD.obtenerPedidoPorId(id);

    return pedido;
}

async function obtenerPedidoConDetalleCompleto(id) {
    if (!id) {
        throw new Error('ID del pedido es requerido');
    }

    const pedido = await clienteAD.obtenerPedidoConDetalleCompleto(id);

    return pedido;
}

async function crearPedidoN(productos, metodo_pago) {

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    throw new Error('No se han proporcionado productos para el pedido');
  }
  
  if (!metodo_pago) {
    throw new Error('Método de pago es requerido');
  }

  const nuevoPedido = await clienteAD.crearPedido(productos, metodo_pago);
  return nuevoPedido;

}

async function ActualizarEstadoPedido(id, estado) {

  const estadosValidos = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'];
  
  if (!estado || !estadosValidos.includes(estado)) {
    throw new Error('Estado invalido')
  }

  if (!id) {
    throw new Error('Id invalido')
  }

  const actualizarPedido = await clienteAD.ActualizarEstadoPedido(id, estado)
  return actualizarPedido;

}

async function EliminarPedido(id) {
  if (!id) {
    throw new Error('id obligatorio');
  }

  return pedidosAD.EliminarPedido(id);

}

async function ObtenerDetalleProductoEnPedido(idPedido, idProducto) {
  if (!idPedido) {
    throw new Error('Id Pedido no valido!');
  }
  if (!idProducto) {
    throw new Error('Id Producto no valido!');
  }

  const detalleProductoEnPedido = await pedidosAD.ObtenerDetalleProductoEnPedido(idPedido, idProducto)
  return detalleProductoEnPedido
}

async function ObtenerEstadisticas() {
  const estadisticas = await pedidosAD.ObtenerEstadisticas();
  return estadisticas;
}

async function obtenerPedidosPorEstado(estado) {
  if (!estado) {
    throw new Error('Estado del pedido es requerido');
  }

  return await pedidosAD.obtenerPedidoPorEstado(estado);
}

async function filtrarPedidosPorFecha(desde, hasta) {

  if (!desde || !hasta) {
    throw new Error('Fechas de inicio y fin son requeridas');
  }

  return await pedidosAD.filtrarPedidosPorFecha(desde, hasta);

}

async function obtenerResumenDeProductosEnPedido(id_pedido) {
  
  if (!id_pedido) {
    throw new Error('ID del pedido es requerido');
  }

  return await pedidosAD.obtenerResumenDeProductosEnPedido(id_pedido);

}


export default {
    obtenerPedido,
    obtenerPedidoPorId,
    obtenerPedidoConDetalleCompleto,
    crearPedidoN,
    ActualizarEstadoPedido,
    EliminarPedido,
    ObtenerDetalleProductoEnPedido,
    ObtenerEstadisticas,
    obtenerPedidosPorEstado,
    filtrarPedidosPorFecha,
    obtenerResumenDeProductosEnPedido
  };