import paymentAD from "../AccesoDatos/paymentAD.js"
import productosAD from "../AccesoDatos/productosAD.js";

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { ESTADOS_PEDIDO, METODO_PAGO } from "../config/const.js";

const client = new MercadoPagoConfig({
    accessToken: process.env.ACCESS_TOKEN
});

async function crearOrden(items) {
    try {
        if (!items || items.length === 0) {
            throw new Error('La lista de items no puede estar vacía');
        }

        const productos = await productosAD.caluclarPrecioYDisponibilidad(items.cart_products)

        let total = 0;

        productos.forEach(producto => {
            if (producto.disponible == false) {
                throw new Error(`El producto ${prod.id_producto} no está disponible`);
            }

            total += Number(producto.precio_base)
        });

        if (items.checkout_steps.paymentMethod != METODO_PAGO.MERCADO_PAGO 
            && items.checkout_steps.paymentMethod != METODO_PAGO.EFECTIVO) {
                throw new Error('El metodo de pago no es valido');
            }

        const fecha_hora = Math.floor(Date.now() / 1000);

        const idPedido = await paymentAD.crearPedido(fecha_hora, total, ESTADOS_PEDIDO.PENDIENTE_PAGO, items.checkout_steps.paymentMethod)

        const crearDetalle = await paymentAD.crearDetallePedido(idPedido, items.cart_products)

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
                    success: "https://example.com/success",
                    failure: "https://example.com/failure",
                    pending: "https://example.com/pending",
                  },
                  auto_return: "approved",
                  notification_url: `https://46796d982895.ngrok-free.app/api/payment/webhook`,
                  external_reference: idPedido.toString(),
                }
              });

              console.log("💳 Init point generado:", result.sandbox_init_point);

              return {
                message: "Pedido creado con Mercado Pago",
                type: METODO_PAGO.MERCADO_PAGO,
                idPedido,
                init_point: result.sandbox_init_point,
              };
        }
        else {
            return {
                message: "Pedido creado con Efectivo",
                type: METODO_PAGO.EFECTIVO,
                idPedido,
              };
        }

    }
    catch (error) {
        console.log("ERROR EN NEGOCIO " + error.message)
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

export default {
    crearOrden,
    marcarPagoCompletado
}