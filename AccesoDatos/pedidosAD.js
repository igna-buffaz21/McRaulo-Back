import sql from '../config/db.js';  // Importar la conexión


async function actualizarEstadoPago(idPedido, estado_pago) {
  try {

    const result = await sql `
    UPDATE public.pedidos
    SET estado = ${estado_pago}
    WHERE id_pedido = ${idPedido};
    `

    return result;
  }
  catch (error) {
    console.error("ERROR AL ACTUALIZAR EL PAGO " + error);
    throw new Error("Error al actualizar el pago " + error.message);
  }
}

export default {
  actualizarEstadoPago
};
