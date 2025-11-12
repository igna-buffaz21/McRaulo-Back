import pedidosN from "../Negocio/pedidosN.js";     

async function obtenerPedidoPendienteDePago(req, res) {
  try {
    const { idPedido } = req.query;

    const response = await pedidosN.obtenerPedidoPendienteDePago(idPedido);

    res.status(200).json(response);

  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function CrearPagoEfectivo(req, res) {
  try {
    const pedido = req.body;

    const response = await pedidosN.CrearPagoEfectivo(pedido.id_pedido);

    res.status(200).json(response);

  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerPedidosPendientes(req, res) {
  try {
    const response = await pedidosN.obtenerPedidosPendientes();

    res.status(200).json(response);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function cambiarEstadoPedido(req, res) {
  try {
    const { idPedido } = req.query
    const { estado } = req.query

    console.log("ID PEDIDO " + idPedido);
    console.log("ESTADO " + estado);

    const response = await pedidosN.cambiarEstadoPedido(idPedido, estado);

    res.status(200).json(response)
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerPedidosPreparacion(req, res) {
  try {
    const response = await pedidosN.obtenerPedidosPreparacion();

    res.status(200).json(response);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerDetallePedido(req, res) {
  try {
    const { idPedido } = req.query

    const response = await pedidosN.obtenerDetallePedido(idPedido)

    res.status(200).json(response)
  } 
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}


async function obtenerPedidosListos(req, res) {
  try {
    const response = await pedidosN.obtenerPedidosListos();

    res.status(200).json(response);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
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