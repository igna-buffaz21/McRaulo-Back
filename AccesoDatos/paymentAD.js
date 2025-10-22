import sql from '../config/db.js';  // Importar la conexión

async function crearPedido(fecha_hora, total, estado, metodo_pago) {
    try {
      const result = await sql`
        INSERT INTO public.pedidos (fecha_hora, total, estado, metodo_pago)
        VALUES (${fecha_hora}, ${total}, ${estado}, ${metodo_pago})
        RETURNING id_pedido;
      `;
  
      return result[0].id_pedido;

    } catch (error) {
      throw new Error('Error al crear el pedido: ' + error.message);
    }
  }

  async function crearDetallePedido(id_pedido, productos) {
    console.log("🧾 Insertando detalles de pedido:", id_pedido, productos.length);
  
    try {
      const values = productos.map((p) => [
        id_pedido,
        p.id_producto,
        p.precio_base,
        p.notas ?? null,
      ]);
  
      const result = await sql`
        INSERT INTO public.pedidos_productos (id_pedido, id_producto, subtotal, notas)
        VALUES ${sql(values)}
        RETURNING *;
      `;
  
      return result;
    } catch (error) {
      console.error("❌ Error al insertar pedidos_productos:", error);
      throw new Error("Error al insertar pedidos_productos: " + error.message);
    }
  }
  
  async function marcarPagoCompletado(estado_pago, mp_preference_id, mp_payment_id, id_pedido) {
    try {
      const result = await sql`
      INSERT INTO public.pago(
      estado_pago, mp_preference_id, mp_payment_id, id_pedido)
      VALUES (${estado_pago}, ${mp_preference_id}, ${mp_payment_id}, ${id_pedido});
      `;

      return result;
    }
    catch (error) {
      console.error("ERROR AL CREAR EL PAGO " + error);
      throw new Error("Error al crear el pago " + error.message);
    }
  }
  
  

export default {
    crearPedido,
    crearDetallePedido,
    marcarPagoCompletado
}