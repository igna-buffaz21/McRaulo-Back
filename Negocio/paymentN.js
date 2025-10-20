import paymentAD from "../AccesoDatos/paymentAD.js"
import productosAD from "../AccesoDatos/productosAD.js";

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { ESTADOS_PEDIDO, METODO_PAGO } from "../config/const.js";

const client = new MercadoPagoConfig({
    accessToken: 'TEST-6903777404502982-081515-937694d25552cc36ee14c041b108c5b1-2631965428'
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

        console.log("EL TOTAL DEL PEDIDO ES: " + total);

        const fecha_hora = Math.floor(Date.now() / 1000);

        const idPedido = await paymentAD.crearPedido(fecha_hora, total, ESTADOS_PEDIDO.PENDIENTE, items.checkout_steps.paymentMethod)

        console.log("ID DEL PEDIDO INSERTDO: " + idPedido)

        const crearDetalle = await paymentAD.crearDetallePedido(idPedido, items.cart_products)

        console.log("RESULTADO DE CREAR DETALLE" + crearDetalle)

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
                    success: `${process.env.FRONT_URL}/pago-exitoso/${idPedido}`,
                    failure: `${process.env.FRONT_URL}/pago-fallido/${idPedido}`,
                    pending: `${process.env.FRONT_URL}/pago-pendiente/${idPedido}`,
                  },
                  auto_return: "approved",
                  notification_url: `${process.env.BACK_URL}/webhook`,
                  external_reference: idPedido.toString(),
                }
              });

              console.log("💳 Init point generado:", result.sandbox_init_point);

              /*return {
                message: "Pedido creado con Mercado Pago",
                idPedido,
                init_point: result.init_point,
              };*/
        }

    }
    catch (error) {
        console.log("ERROR EN NEGOCIO " + error.message)
    }
}

export default {
    crearOrden
}