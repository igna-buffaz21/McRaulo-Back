import sql from '../config/db.js';  // Importar la conexión

async function obtenerPedido() {
    try{
        const result = await sql`SELECT * FROM pedidos`;
        return result;
    }
    catch (error) {
        throw new Error('Error al obtener los pedidos: ' + error.message);
    }
}

async function obtenerPedidoPorId(id) {
    try {
        const result = await sql`SELECT * FROM pedidos WHERE id_pedido = ${id}`;
        if (result.length === 0) {
            throw new Error('Pedido no encontrado');
        }
        return result[0];
    }
    catch (error) {
        throw new Error('Error al obtener el pedido por ID: ' + error.message);
    }
}

async function obtenerPedidoConDetalleCompleto(id) {
    try {
        const pedido = await sql`
        SELECT * FROM pedidos
        WHERE id_pedido = ${id};
      `;

      if (pedido.length === 0) {
        throw new Error('Pedido no encontrado');
      }

      const productos = await sql`
      SELECT pp.*, p.nombre, p.descripcion, p.categoria
      FROM pedidos_productos pp
      JOIN productos p ON pp.id_producto = p.id_producto
      WHERE pp.id_pedido = ${id}; 
    `; // Obtener productos del pedido

    const productosConIngredientes = await Promise.all(
        productos.map(async (producto) => {
          const ingredientes = await sql`
            SELECT ppi.*, i.nombre, i.descripcion, i.unidad_medida
            FROM pedidos_productos_ingredientes ppi
            JOIN ingredientes i ON ppi.id_ingrediente = i.id_ingrediente
            WHERE ppi.id_pedido_producto = ${producto.id_pedido_producto};
          `; // Obtener ingredientes personalizados del producto
          
          return {
            ...producto,
            ingredientes_personalizados: ingredientes
          };
        })
      );

      return {
        ...pedido[0],
        productos: productosConIngredientes
      }; 

    }
    catch (error) {
        throw new Error('Error al obtener el pedido con detalle completo: ' + error.message);
    }
}

async function crearPedido(productos, metodo_pago) {
  try {
    return await sql.begin(async (sql) => {
      let total = 0;

      for (const producto of productos) {
        // Verificar que el producto existe y está disponible
        const productoInfo = await sql`
          SELECT * FROM productos 
          WHERE id_producto = ${producto.id_producto} 
          AND disponible = TRUE;
        `;
        
        if (productoInfo.length === 0) {
          throw new Error(`El producto con ID ${producto.id_producto} no existe o no está disponible`);
        }
        
        // Calcular precio base (siempre 1 unidad por fila)
        let subtotal = productoInfo[0].precio_base;
        
        // Calcular precios de ingredientes extras
        if (producto.ingredientes_personalizados && producto.ingredientes_personalizados.length > 0) {
          for (const ingrediente of producto.ingredientes_personalizados) {
            // Solo calcular para ingredientes extras
            if (ingrediente.es_extra) {
              const ingredienteInfo = await sql`
                SELECT * FROM ingredientes
                WHERE id_ingrediente = ${ingrediente.id_ingrediente};
              `;
              
              if (ingredienteInfo.length === 0) {
                throw new Error(`El ingrediente con ID ${ingrediente.id_ingrediente} no existe`);
              }
              
              // Agregar costo de ingrediente extra
              subtotal += ingredienteInfo[0].precio * ingrediente.cantidad;
            }
          }
        }
        
        // Actualizar subtotal del producto
        producto.subtotal = subtotal;
        total += subtotal;
      }

      // Crear nuevo pedido
      const fechaHora = Math.floor(Date.now() / 1000);
      
      const nuevoPedido = await sql`
              INSERT INTO pedidos (fecha_hora, estado, total, metodo_pago, id_cliente)
              VALUES (${fechaHora}, 'pendiente', ${total}, ${metodo_pago}, 1)
              RETURNING *;
            `;

      // Insertar productos del pedido (cada producto como fila individual)
      const productosCreados = [];
      for (const producto of productos) {
        const nuevoPedidoProducto = await sql`
          INSERT INTO pedidos_productos (id_pedido, id_producto, subtotal, notas)
          VALUES (
            ${nuevoPedido[0].id_pedido}, 
            ${producto.id_producto}, 
            ${producto.subtotal}, 
            ${producto.notas || null}
          )
          RETURNING *;
        `;
        
        productosCreados.push(nuevoPedidoProducto[0]);
        
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

      return {
        id_pedido: nuevoPedido[0].id_pedido,
        fecha_hora: nuevoPedido[0].fecha_hora,
        estado: nuevoPedido[0].estado,
        total: nuevoPedido[0].total,
        metodo_pago: nuevoPedido[0].metodo_pago,
        productos_creados: productosCreados
      };

    });      
  }
  catch (error) {
    throw new Error('Error al crear el pedido: ' + error.message);
  }
}

async function ActualizarEstadoPedido(id, estado) {
  try {
      const pedidoExistente = await sql`
        SELECT * FROM pedidos
        WHERE id_pedido = ${id};
      `;
      
      if (pedidoExistente.length === 0) {
        return res.status(404).json({
          status: 'ERROR',
          message: `No se encontró el pedido con ID ${id}`
        });
      }

          // Actualizar el estado
      const pedidoActualizado = await sql`
      UPDATE pedidos
      SET estado = ${estado}
      WHERE id_pedido = ${id}
      RETURNING *;
      `;

      return pedidoActualizado;
  }
  catch (error) {
    throw new Error('Error al actualizar estado: ' + error.message);
  }
}

async function EliminarPedido(id) {
  try {
        // Verificar que el pedido existe
        const pedidoExistente = await sql`
        SELECT * FROM pedidos
        WHERE id_pedido = ${id};
      `;
      
      if (pedidoExistente.length === 0) {
        throw new Error('El pedido no')
      }

    // Usar transacción para eliminar en cascada
    return await sql.begin(async (sql) => {
      // 1. Primero, obtener todos los pedidos_productos
      const pedidosProductos = await sql`
        SELECT id_pedido_producto FROM pedidos_productos
        WHERE id_pedido = ${id};
      `;
      
      // 2. Eliminar ingredientes personalizados
      for (const pedidoProducto of pedidosProductos) {
        await sql`
          DELETE FROM pedidos_productos_ingredientes
          WHERE id_pedido_producto = ${pedidoProducto.id_pedido_producto};
        `;
      }
      
      // 3. Eliminar productos del pedido
      await sql`
        DELETE FROM pedidos_productos
        WHERE id_pedido = ${id};
      `;
      
      // 4. Eliminar el pedido
      await sql`
        DELETE FROM pedidos
        WHERE id_pedido = ${id};
      `;

      return true;
    });

  }
  catch (error) {
    throw new Error('Error al eliminar un pedido' + error);
  }
}

async function ObtenerDetalleProductoEnPedido(idPedido, idProducto) {
  try {
    const productoEnPedido = await sql`
    SELECT pp.*, p.nombre, p.descripcion, p.categoria
    FROM pedidos_productos pp
    JOIN productos p ON pp.id_producto = p.id_producto
    WHERE pp.id_pedido = ${idPedido} AND pp.id_pedido_producto = ${idProducto};
  `;
  
  if (productoEnPedido.length === 0) {
    throw new Error('No se encontro el producto en el pediddo')
  }
  
  // Obtener ingredientes personalizados del producto
  const ingredientes = await sql`
    SELECT ppi.*, i.nombre, i.descripcion, i.unidad_medida
    FROM pedidos_productos_ingredientes ppi
    JOIN ingredientes i ON ppi.id_ingrediente = i.id_ingrediente
    WHERE ppi.id_pedido_producto = ${idProducto};
  `;

  const ingredientesExtra = ingredientes.filter(ing => ing.es_extra);
  const ingredientesRemovidos = ingredientes.filter(ing => !ing.es_extra);

  return {
    ...productoEnPedido[0],
    ingredientesExtra,
    ingredientesRemovidos
  }

  }
  catch(error) {
    throw new Error('Error al obtener el producto en el pedido');
    
  }
}

async function ObtenerEstadisticas() {
  try {
    // Total de pedidos
    const totalPedidos = await sql`
      SELECT COUNT(*) as total FROM pedidos;
    `;
    
    // Pedidos por estado
    const pedidosPorEstado = await sql`
      SELECT estado, COUNT(*) as cantidad 
      FROM pedidos 
      GROUP BY estado;
    `;
    
    // Productos más vendidos (MODIFICADO - contar filas en lugar de sumar cantidad)
    const productosMasVendidos = await sql`
      SELECT p.id_producto, p.nombre, p.categoria, 
             COUNT(pp.id_pedido_producto) as unidades_vendidas,
             SUM(pp.subtotal) as ventas_totales
      FROM pedidos_productos pp
      JOIN productos p ON pp.id_producto = p.id_producto
      GROUP BY p.id_producto, p.nombre, p.categoria
      ORDER BY unidades_vendidas DESC
      LIMIT 5;
    `;
    
    // Ingredientes extras más solicitados
    const ingredientesMasSolicitados = await sql`
      SELECT i.id_ingrediente, i.nombre, i.unidad_medida,
             SUM(ppi.cantidad) as veces_solicitado
      FROM pedidos_productos_ingredientes ppi
      JOIN ingredientes i ON ppi.id_ingrediente = i.id_ingrediente
      WHERE ppi.es_extra = TRUE
      GROUP BY i.id_ingrediente, i.nombre, i.unidad_medida
      ORDER BY veces_solicitado DESC
      LIMIT 5;
    `;
    
    // Ventas por método de pago
    const ventasPorMetodoPago = await sql`
      SELECT metodo_pago, COUNT(*) as cantidad_pedidos, SUM(total) as total_ventas
      FROM pedidos
      GROUP BY metodo_pago;
    `;

    // Nueva estadística: Productos con más personalizaciones
    const productosConMasPersonalizaciones = await sql`
      SELECT p.id_producto, p.nombre, p.categoria,
             COUNT(ppi.id_pedido_producto) as total_personalizaciones,
             COUNT(DISTINCT pp.id_pedido_producto) as productos_personalizados
      FROM productos p
      JOIN pedidos_productos pp ON p.id_producto = pp.id_producto
      JOIN pedidos_productos_ingredientes ppi ON pp.id_pedido_producto = ppi.id_pedido_producto
      GROUP BY p.id_producto, p.nombre, p.categoria
      ORDER BY total_personalizaciones DESC
      LIMIT 5;
    `;

    return {
      total_pedidos: totalPedidos[0].total,
      pedidos_por_estado: pedidosPorEstado,
      productos_mas_vendidos: productosMasVendidos,
      ingredientes_extras_mas_solicitados: ingredientesMasSolicitados,
      ventas_por_metodo_pago: ventasPorMetodoPago,
      productos_con_mas_personalizaciones: productosConMasPersonalizaciones
    }
  }
  catch (error) {
    throw new Error('Error al obtener Estadisticas ');
  }
}

  

export default {
    obtenerPedido,
    obtenerPedidoPorId,
    obtenerPedidoConDetalleCompleto,
    crearPedido,
    ActualizarEstadoPedido,
    EliminarPedido,
    ObtenerDetalleProductoEnPedido,
    ObtenerEstadisticas
  };