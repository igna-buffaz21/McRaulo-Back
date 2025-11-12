import paymentAD from "../AccesoDatos/paymentAD.js"
import productosAD from "../AccesoDatos/productosAD.js";
import sql from '../config/db.js'; // conexión ya configurada (pool o client)

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { ESTADOS_PEDIDO, METODO_PAGO } from "../config/const.js";

const client = new MercadoPagoConfig({
    accessToken: process.env.ACCESS_TOKEN
});

async function crearOrden(items) {
    const client = await sql.connect(); 
  
    try {
      if (!items || items.length === 0) {
        throw new Error('La lista de items no puede estar vacía');
      }

      if (
        items.checkout_steps.paymentMethod != METODO_PAGO.MERCADO_PAGO &&
        items.checkout_steps.paymentMethod != METODO_PAGO.EFECTIVO
      ) {
        throw new Error('El metodo de pago no es valido');
      }
  
      await client.query('BEGIN');
  
      const productos = await productosAD.caluclarPrecioYDisponibilidad(items.cart_products);
      let total = 0;
  
      productos.forEach(prod => {
        if (!prod.disponible) {
          throw new Error(`El producto ${prod.id_producto} no está disponible`);
        }
        total += Number(prod.precio_base);
      });
  
      const fecha_hora = Math.floor(Date.now() / 1000);
  
      const idPedido = await paymentAD.crearPedido(
        fecha_hora,
        total,
        ESTADOS_PEDIDO.PENDIENTE_PAGO,
        items.checkout_steps.paymentMethod,
        items.checkout_steps.orderType
      );
  
      await paymentAD.crearDetallePedido(idPedido, items.cart_products);
  
      await client.query('COMMIT');
  
      if (items.checkout_steps.paymentMethod == METODO_PAGO.MERCADO_PAGO) {
        const preference = new Preference(client);
        const result = await preference.create({
          body: {
            items: items.cart_products.map(p => ({
              title: `Producto #${p.id_producto}`,
              unit_price: Number(p.precio_base),
              currency_id: "ARS",
              quantity: 1,
            })),
            back_urls: {
              success: `${process.env.FRONT_URL}/estado-pago`,
              failure: `${process.env.FRONT_URL}/estado-pago`,
              pending: `${process.env.FRONT_URL}/estado-pago`,
            },
            auto_return: "approved",
            notification_url: `${process.env.BACK_URL}/api/payment/webhook`,
            external_reference: idPedido.toString(),
          },
        });
  
        console.log("💳 Init point generado:", result.sandbox_init_point);
  
        return {
          message: "Pedido creado con Mercado Pago",
          type: METODO_PAGO.MERCADO_PAGO,
          idPedido,
          init_point: result.sandbox_init_point,
        };
      } else {
        return {
          message: "Pedido creado con Efectivo",
          type: METODO_PAGO.EFECTIVO,
          idPedido,
        };
      }
  
    } 
    catch (error) {
      await client.query('ROLLBACK');

      console.error("ERROR EN NEGOCIO:", error.message);

      throw error;
    } 
    finally {
      client.release();
    }
  }

async function marcarPagoCompletado(estado_pago, mp_preference_id, mp_payment_id, id_pedido) {
    try {

        console.log("estado_pago " + estado_pago)
        console.log("mp_preference_id: " + mp_preference_id)
        console.log("mp_payment_id: " + mp_payment_id)
        console.log("id_pedido " + id_pedido)


        const response = await paymentAD.marcarPagoCompletado(estado_pago, mp_preference_id, mp_payment_id, id_pedido)

        return response;
    }
    catch (error) {
        console.log("ERROR EN NEGOCIO " + error.message)
    }
}

async function comprobarPago(idPedido, idPago) {
    try {
        const response = await paymentAD.comprobarPago(idPedido, idPago)

        return response
    }
    catch (error) {
        console.log("ERROR EN NEGOCIO " + error.message)
    }
}

export default {
    crearOrden,
    marcarPagoCompletado,
    comprobarPago
}