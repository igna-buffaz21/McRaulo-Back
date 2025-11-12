import sql from '../config/db.js';  // Importar la conexión


async function actualizarEstadoPago(idPedido, estado_pago) {
  try {

    const result = await sql `
    UPDATE public.pedidos
    SET estado = ${estado_pago}
    WHERE id_pedido = ${idPedido};
    `

    return result[0];
  }
  catch (error) {
    console.error("ERROR AL ACTUALIZAR EL PAGO " + error);
    throw new Error("Error al actualizar el pago " + error.message);
  }
}

async function obtenerPedidoPendienteDePago(id_pedido) {
  try {
    const result = await sql `
    SELECT * FROM public.pedidos
    WHERE estado = 'pendiente_pago' AND metodo_pago = 'cash' AND id_pedido = ${id_pedido}
    ORDER BY id_pedido ASC;
    `

    return result;
  }
  catch (error) {
    console.error("ERROR AL OBTENER LOS PEDIDOS PENDIENTE DE PAGO " + error);
    throw new Error("Error obtener los pedidos pendientes " + error.message);
  }
}

async function CrearPagoEfectivo(estado_pago, id_pedido) {
  try {
    const result = await sql `
    INSERT INTO public.pago(
    estado_pago, id_pedido)
    VALUES (${estado_pago}, ${id_pedido});
    `

    return result;
  }
  catch (error) {
    console.error("ERROR AL MARCAR PAGO COMPLETADO " + error);
    throw new Error("Error al marcar pago completado " + error.message);
  }
}

async function obtenerPedidosPendientes() {
  try {
    const result = await sql `
    SELECT * FROM public.pedidos
    WHERE estado = 'pendiente'
    ORDER BY id_pedido ASC;
    `;

    return result;
  }
  catch (error) {
    console.error("ERROR AL OBTENER LOS PEDIDOS PENDIENTES" + error);
    throw new Error("Error al obtener los pedidos pendientes " + error.message);
  }
}

async function obtenerPedidosPreparacion() {
  try {
    const result = await sql `
    SELECT * FROM pedidos 
    WHERE estado = 'preparacion'
    ORDER BY id_pedido ASC;
    `;
  
    return result;
  }
  catch (error) {
    console.log("ERROR " + error)
  }

}

async function obtenerDetallePedido(id_pedido) {
  try {
    const result = await sql `
    SELECT p.id_pedido, pr.nombre, pp.notas FROM pedidos p
    INNER JOIN pedidos_productos pp ON p.id_pedido = pp.id_pedido
    INNER JOIN productos pr ON pr.id_producto = pp.id_producto
    WHERE estado = 'preparacion' AND p.id_pedido = ${id_pedido}
    ORDER BY p.id_pedido ASC;
    `

    return result
  }
  catch (error) {
    console.log("ERROR " + error)
  }
}

async function obtenerPedidosListos() {
  try {
    const result = await sql `
    SELECT * FROM pedidos 
    WHERE estado = 'listo'
    ORDER BY id_pedido ASC;
    `;
  
    return result;
  }
  catch (error) {
    console.log("ERROR " + error)
  }

}

export default {
  actualizarEstadoPago,
  obtenerPedidoPendienteDePago,
  CrearPagoEfectivo,
  obtenerPedidosPendientes,
  obtenerPedidosPreparacion,
  obtenerDetallePedido,
  obtenerPedidosListos
};
