import paymentN from '../Negocio/paymentN.js';

async function crearOrden(req, res) {
    const pedido = req.body;

    try {

        const response = await paymentN.crearOrden(pedido);

        res.status(200).json(response)
    }
    catch (error) {
        res.status(500).json(error)
        console.error(error);
    }
}

async function webhook(req, res) {
    try {
        const data = req.body;
  
        //console.log("📩 Webhook recibido de Mercado Pago:", data);

        if (data.type === "payment" || data.topic === "payment") {
          const paymentId = data.data.id;
  
          const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
              Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            },
          });
          const payment = await response.json();


          if (payment.status == "approved") {
            console.log("------------------------PAGO SE REALIZO CON EXITO------------------------")
            const response = await paymentN.marcarPagoCompletado(payment.status, payment.id, payment.preference_id || null, Number(payment.external_reference))
            res.status(200).json("Pago realizado con exito " + response)

          }
          else if (payment.status == "rejected") {
            console.log("------------------------PAGO RECHAZADO------------------------")
            const response = await paymentN.marcarPagoCompletado(payment.status, payment.id, payment.preference_id, Number(payment.external_reference))
            res.status(200).json("Pago rechazado " + response)
          }
          else if (payment.status == "pending") {
            console.log("------------------------PAGO PENDIENTE------------------------")
            const response = await paymentN.marcarPagoCompletado(payment.status, payment.id, payment.preference_id, Number(payment.external_reference))
            res.status(200).json("Pago pendiente " + response)
          }
          else {
            res.status(500)
          }

          //console.log("🧾 Detalle de pago recibido:", payment);  
        }
  
      } 
      catch (error) {
        console.error("❌ Error procesando webhook MP:", error);
        res.sendStatus(500);
      }
}
export default {
    crearOrden,
    webhook
}

