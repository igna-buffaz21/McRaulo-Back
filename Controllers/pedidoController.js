import pedidosN from "../Negocio/pedidosN.js";     

async function obtenerPedido(req, res) {
    try {
        const pedidos = await pedidosN.obtenerPedido();
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
}

async function obtenerPedidoPorId(req, res) {
    const id = req.params.id;
    try {
        const pedido = await pedidosN.obtenerPedidoPorId(id);
        res.status(200).json(pedido);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el pedido por ID' });
    }
}

async function obtenerPedidoConDetalleCompleto(req, res) {
    const id = req.params.id;
    try {
        const pedido = await pedidosN.obtenerPedidoConDetalleCompleto(id);
        res.status(200).json(pedido);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el pedido con detalle completo' });
    }
}

async function crearPedidoN(req, res) {
    const { productos, metodo_pago } = req.body;
    try {
        const nuevoPedido = await pedidosN.crearPedidoN(productos, metodo_pago);

        res.status(201).json({
            status: 'OK',
            message: 'Pedido creado correctamente',
            data: {
              id_pedido: nuevoPedido.id_pedido,
              fecha_hora: nuevoPedido.fecha_hora,
              estado: nuevoPedido.estado,
              total: nuevoPedido.total,
              metodo_pago: nuevoPedido.metodo_pago,
              productos_creados: nuevoPedido.productos_creados.length // 🔧 CORREGIDO
            }
          }); 
    }
    catch (error) {
        console.error('Error al crear el pedido:', error);
        res.status(500).json({
          status: 'ERROR',
          message: 'Error al crear el pedido',
          error: error.message
        });
    }
}

async function ActualizarEstadoPedido(req, res) {
    const { id, estado } = req.body;
    try {
        const actualizarPedido = await pedidosN.ActualizarEstadoPedido(id, estado)
        res.json({
            status: 'OK',
            message: `Estado del pedido actualizado a "${estado}"`,
            data: actualizarPedido
          });
    }
    catch (error) {
        console.error(`Error al actualizar estado del pedido ${id}:`, error);
        res.status(500).json({
          status: 'ERROR',
          message: `Error al actualizar estado del pedido ${id}`,
          error: error.message
        });
    }
}

async function EliminarPedido(req, res) {
    const id = req.params.id
    try {
        const result = pedidosN.EliminarPedido(id)
        if (result) {
            res.json({
                status: 'OK',
                message: `Pedido Eliminado "${id}"`
            });    
        }
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: `Error al eliminar el pedido ${id}`,
            error: error.message
        });
    }
}

async function ObtenerDetalleProductoEnPedido(req, res) {
    const idPedido = req.params.idPedido
    const idProducto = req.params.idProducto

    try {
        const detalleProductoEnPedido = await pedidosN.ObtenerDetalleProductoEnPedido(idPedido,idProducto)
        res.json({
            status: 'OK',
            detalleProductoEnPedido
          });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: `Error al obtener detalle del producto en el pedido`,
            error: error.message
          });
    }
}

async function ObtenerEstadisticas(req, res) {
    try {
        const estadisticas = await pedidosN.ObtenerEstadisticas()
        res.json({
            status: 'OK',
            estadisticas
          });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Error al obtener estadísticas de pedidos',
            error: error.message
        });
    }
}

async function obtenerPedidoPorEstado(req, res) {
    try {
        const {estado} = req.params;

        console.log('Estado recibido:', estado);

        const pedidos = await pedidosN.obtenerPedidosPorEstado(estado);

        res.json({
            status: 'OK',
            data: pedidos
          });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: `Error al obtener pedidos con estado ${estado}`,
            error: error.message
          });
    }
}

async function filtrarPedidosPorFecha(req, res) {

    try {
        const { desde, hasta } = req.params;

        console.log('Fechas recibidas:', desde, hasta);

        const pedidos = await pedidosN.filtrarPedidosPorFecha(desde, hasta);

        res.json({
            status: 'OK',
            data: pedidos
          });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Error al filtrar pedidos por fecha',
            error: error.message
          });
    }
    
}

async function obtenerResumenDeProductosEnPedido(req, res) {
    try {
        const { id } = req.params;

        const resumen = await pedidosN.obtenerResumenDeProductosEnPedido(id);

        res.json({
            status: 'OK',
            data: resumen
        })
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: `Error al obtener resumen de productos en el pedido ${id}`,
            error: error.message
        });
    }
}

async function agregarProductosAPedido(req, res) {
    try {
        const { id } = req.params;
        const { productos } = req.body;
        
        const resultado = await pedidosN.agregarProductosAPedido(id, productos);
        
        res.status(200).json({
            status: 'OK',
            message: 'Productos agregados correctamente al pedido',
            data: resultado
        });
    } catch (error) {
        console.error(`Error al agregar productos al pedido:`, error);
        
        // Determinar código de estado según el tipo de error
        let statusCode = 500;
        if (error.message.includes('no existe') || error.message.includes('No se encontró')) {
            statusCode = 404;
        } else if (error.message.includes('requerido') || error.message.includes('Debe incluir') || error.message.includes('No se pueden agregar')) {
            statusCode = 400;
        }
        
        res.status(statusCode).json({
            status: 'ERROR',
            message: error.message
        });
    }
}

async function eliminarProductoDePedido(req, res) {
    try {
        const { id, idProducto } = req.params;
        
        const resultado = await pedidosN.eliminarProductoDePedido(id, idProducto);
        
        res.status(200).json({
            status: 'OK',
            message: 'Producto eliminado correctamente del pedido',
            data: resultado
        });
    } catch (error) {
        console.error(`Error al eliminar producto del pedido:`, error);
        
        // Determinar código de estado según el tipo de error
        let statusCode = 500;
        if (error.message.includes('no existe') || error.message.includes('No se encontró')) {
            statusCode = 404;
        } else if (error.message.includes('requerido') || error.message.includes('No se pueden eliminar')) {
            statusCode = 400;
        }
        
        res.status(statusCode).json({
            status: 'ERROR',
            message: error.message
        });
    }
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
    obtenerPedidoPorEstado,
    filtrarPedidosPorFecha,
    obtenerResumenDeProductosEnPedido,
    agregarProductosAPedido,
    eliminarProductoDePedido
  };