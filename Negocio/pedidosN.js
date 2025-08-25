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

async function agregarProductosAPedido(idPedido, productos) {
  // Validaciones básicas
  if (!idPedido) {
      throw new Error('ID del pedido es requerido');
  }
  
  if (!productos || !Array.isArray(productos) || productos.length === 0) {
      throw new Error('Debe incluir al menos un producto para agregar al pedido');
  }
  
  // Verificar que el pedido existe
  const pedidoExistente = await pedidosAD.obtenerPedidoPorId(idPedido);
  
  if (pedidoExistente.length === 0) {
      throw new Error(`No se encontró el pedido con ID ${idPedido}`);
  }
  
  // Verificar estado del pedido
  if (['entregado', 'cancelado'].includes(pedidoExistente[0].estado)) {
      throw new Error(`No se pueden agregar productos a un pedido en estado "${pedidoExistente[0].estado}"`);
  }
  
  // Usar transacción para agregar productos
  return await sql.begin(async (sql) => {
      let totalAdicional = 0;
      const productosAgregados = [];
      
      // Procesar cada producto
      for (const producto of productos) {
          // Validar producto existe
          if (!producto.id_producto) {
              throw new Error('ID del producto es requerido');
          }
          
          const productoInfo = await sql`
              SELECT * FROM productos 
              WHERE id_producto = ${producto.id_producto} 
              AND disponible = TRUE;
          `;
          
          if (productoInfo.length === 0) {
              throw new Error(`El producto con ID ${producto.id_producto} no existe o no está disponible`);
          }
          
          // Calcular subtotal
          let subtotal = productoInfo[0].precio_base;
          
          // Procesar ingredientes personalizados
          if (producto.ingredientes_personalizados && producto.ingredientes_personalizados.length > 0) {
              for (const ingrediente of producto.ingredientes_personalizados) {
                  if (ingrediente.es_extra) {
                      const ingredienteInfo = await sql`
                          SELECT * FROM ingredientes
                          WHERE id_ingrediente = ${ingrediente.id_ingrediente};
                      `;
                      
                      if (ingredienteInfo.length === 0) {
                          throw new Error(`El ingrediente con ID ${ingrediente.id_ingrediente} no existe`);
                      }
                      
                      subtotal += ingredienteInfo[0].precio * ingrediente.cantidad;
                  }
              }
          }
          
          totalAdicional += subtotal;
          
          // Insertar producto al pedido
          const nuevoPedidoProducto = await sql`
              INSERT INTO pedidos_productos (id_pedido, id_producto, subtotal, notas)
              VALUES (${idPedido}, ${producto.id_producto}, ${subtotal}, ${producto.notas || null})
              RETURNING *;
          `;
          
          productosAgregados.push(nuevoPedidoProducto[0]);
          
          // Insertar ingredientes personalizados
          if (producto.ingredientes_personalizados && producto.ingredientes_personalizados.length > 0) {
              for (const ingrediente of producto.ingredientes_personalizados) {
                  await sql`
                      INSERT INTO pedidos_productos_ingredientes (
                          id_pedido_producto, 
                          id_ingrediente, 
                          cantidad, 
                          es_extra
                      )
                      VALUES (
                          ${nuevoPedidoProducto[0].id_pedido_producto}, 
                          ${ingrediente.id_ingrediente}, 
                          ${ingrediente.cantidad}, 
                          ${ingrediente.es_extra}
                      );
                  `;
              }
          }
      }
      
      // Actualizar total del pedido
      const nuevoTotal = pedidoExistente[0].total + totalAdicional;
      const pedidoActualizado = await sql`
          UPDATE pedidos
          SET total = ${nuevoTotal}
          WHERE id_pedido = ${idPedido}
          RETURNING *;
      `;
      
      return {
          pedido: pedidoActualizado[0],
          productos_agregados: productosAgregados,
          total_adicional: totalAdicional
      };
  });
}

async function eliminarProductoDePedido(idPedido, idPedidoProducto) {
  // Validaciones básicas
  if (!idPedido) {
      throw new Error('ID del pedido es requerido');
  }
  
  if (!idPedidoProducto) {
      throw new Error('ID del producto es requerido');
  }
  
  // Verificar que el pedido existe
  const pedidoExistente = await pedidosAD.obtenerPedidoPorId(idPedido);
  
  if (pedidoExistente.length === 0) {
      throw new Error(`No se encontró el pedido con ID ${idPedido}`);
  }
  
  // Verificar que el producto existe en el pedido
  const productoEnPedido = await pedidosAD.obtenerProductoEnPedido(idPedido, idPedidoProducto);
  
  if (productoEnPedido.length === 0) {
      throw new Error(`No se encontró el producto ${idPedidoProducto} en el pedido ${idPedido}`);
  }
  
  // Verificar estado del pedido
  if (['entregado', 'cancelado'].includes(pedidoExistente[0].estado)) {
      throw new Error(`No se pueden eliminar productos de un pedido en estado "${pedidoExistente[0].estado}"`);
  }
  
  // Usar transacción para eliminar
  return await sql.begin(async (sql) => {
      const subtotalEliminado = productoEnPedido[0].subtotal;
      
      // Eliminar ingredientes personalizados del producto
      await sql`
          DELETE FROM pedidos_productos_ingredientes
          WHERE id_pedido_producto = ${idPedidoProducto};
      `;
      
      // Eliminar el producto del pedido
      await sql`
          DELETE FROM pedidos_productos
          WHERE id_pedido_producto = ${idPedidoProducto};
      `;
      
      // Actualizar el total del pedido
      const nuevoTotal = pedidoExistente[0].total - subtotalEliminado;
      
      const pedidoActualizado = await sql`
          UPDATE pedidos
          SET total = ${nuevoTotal}
          WHERE id_pedido = ${idPedido}
          RETURNING *;
      `;
      
      return {
          pedido: pedidoActualizado[0],
          subtotal_eliminado: subtotalEliminado
      };
  });
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
    obtenerResumenDeProductosEnPedido,
    agregarProductosAPedido,
    eliminarProductoDePedido
  };