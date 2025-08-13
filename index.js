import express from 'express';
import dotenv from 'dotenv';
import sql, { testConnection } from './config/db.js';
import pedidoRouter from './Router/pedidosR.js'; 
import productoRouter from './Router/productosR.js'; // Importar el router de productos
import ingredientesRouter from './Router/ingredientesR.js';
import clientesRouter from './Router/clientesR.js'

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express(); //te levanta un servidor http //se usa una sola vez en toda la app
const PORT = process.env.PORT; 

// Middleware para parsear JSON
app.use(express.json()); ///todas las respuestas se devuleven en json

// Verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({
    message: 'API de Autoservicio de Hamburguesas',
    status: 'OK',
    timestamp: new Date()
  });
});

// Verificar la conexión a la base de datos
app.get('/db-test', async (req, res) => {
  try {
    // Testear la conexión
    const isConnected = await testConnection();
    
    if (isConnected) {
      // Si la conexión es exitosa, obtener información de las tablas
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      
      res.json({
        status: 'OK',
        message: 'Conexión exitosa a la base de datos',
        tables: tables.map(t => t.table_name)
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'No se pudo conectar a la base de datos'
      });
    }
  } catch (error) {
    console.error('Error al verificar la conexión:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al verificar la conexión a la base de datos',
      error: error.message
    });
  }
});

app.use('/api/pedidos', pedidoRouter);

app.use('/api/productos', productoRouter);

app.use('/api/ingredientes', ingredientesRouter);

app.use('/api/clientes', clientesRouter)


// 9. Agregar productos a un pedido existente (MODIFICADO)
app.post('/api/pedidos/:id/productos', async (req, res) => {
  const { id } = req.params;
  const { productos } = req.body;
  
  // Validaciones básicas
  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      status: 'ERROR',
      message: 'Debe incluir al menos un producto para agregar al pedido'
    });
  }
  
  try {
    // Verificar que el pedido existe
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
    
    // Verificar que el pedido no esté en estado "entregado" o "cancelado"
    if (['entregado', 'cancelado'].includes(pedidoExistente[0].estado)) {
      return res.status(400).json({
        status: 'ERROR',
        message: `No se pueden agregar productos a un pedido en estado "${pedidoExistente[0].estado}"`
      });
    }
    
    // Usar transacción
    return await sql.begin(async (sql) => {
      let totalAdicional = 0;
      const productosAgregados = [];
      
      // Calcular subtotales por cada producto individual
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
        
        // Calcular precio base (1 unidad por fila)
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
        
        totalAdicional += subtotal;
        
        // Insertar producto individual
        const nuevoPedidoProducto = await sql`
          INSERT INTO pedidos_productos (id_pedido, id_producto, subtotal, notas)
          VALUES (
            ${id}, 
            ${producto.id_producto}, 
            ${subtotal}, 
            ${producto.notas || null}
          )
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
      
      // Actualizar el total del pedido
      const nuevoTotal = pedidoExistente[0].total + totalAdicional;
      
      const pedidoActualizado = await sql`
        UPDATE pedidos
        SET total = ${nuevoTotal}
        WHERE id_pedido = ${id}
        RETURNING *;
      `;
      
      return res.json({
        status: 'OK',
        message: 'Productos agregados correctamente al pedido',
        data: {
          pedido: pedidoActualizado[0],
          productos_agregados: productosAgregados,
          total_adicional: totalAdicional
        }
      });
    });
  } catch (error) {
    console.error(`Error al agregar productos al pedido ${id}:`, error);
    res.status(500).json({
      status: 'ERROR',
      message: `Error al agregar productos al pedido ${id}`,
      error: error.message
    });
  }
});

// 12. NUEVO ENDPOINT: Eliminar un producto específico de un pedido
app.delete('/api/pedidos/:id/productos/:idProducto', async (req, res) => {
  const { id, idProducto } = req.params;
  
  try {
    // Verificar que el pedido existe
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
    
    // Verificar que el producto existe en el pedido
    const productoEnPedido = await sql`
      SELECT * FROM pedidos_productos
      WHERE id_pedido = ${id} AND id_pedido_producto = ${idProducto};
    `;
    
    if (productoEnPedido.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: `No se encontró el producto ${idProducto} en el pedido ${id}`
      });
    }
    
    // Verificar que el pedido no esté entregado o cancelado
    if (['entregado', 'cancelado'].includes(pedidoExistente[0].estado)) {
      return res.status(400).json({
        status: 'ERROR',
        message: `No se pueden eliminar productos de un pedido en estado "${pedidoExistente[0].estado}"`
      });
    }
    
    // Usar transacción para eliminar
    return await sql.begin(async (sql) => {
      const subtotalEliminado = productoEnPedido[0].subtotal;
      
      // Eliminar ingredientes personalizados del producto
      await sql`
        DELETE FROM pedidos_productos_ingredientes
        WHERE id_pedido_producto = ${idProducto};
      `;
      
      // Eliminar el producto del pedido
      await sql`
        DELETE FROM pedidos_productos
        WHERE id_pedido_producto = ${idProducto};
      `;
      
      // Actualizar el total del pedido
      const nuevoTotal = pedidoExistente[0].total - subtotalEliminado;
      
      const pedidoActualizado = await sql`
        UPDATE pedidos
        SET total = ${nuevoTotal}
        WHERE id_pedido = ${id}
        RETURNING *;
      `;
      
      return res.json({
        status: 'OK',
        message: 'Producto eliminado correctamente del pedido',
        data: {
          pedido: pedidoActualizado[0],
          subtotal_eliminado: subtotalEliminado
        }
      });
    });
  } catch (error) {
    console.error(`Error al eliminar producto ${idProducto} del pedido ${id}:`, error);
    res.status(500).json({
      status: 'ERROR',
      message: `Error al eliminar producto del pedido`,
      error: error.message
    });
  }
});

// 19. Calcular precio estimado de un producto personalizado
app.post('/api/productos/:id/calcular-precio', async (req, res) => {
  const { id } = req.params;
  const { ingredientes_personalizados } = req.body;
  
  try {
    // Obtener información del producto base
    const producto = await sql`
      SELECT * FROM productos
      WHERE id_producto = ${id} AND disponible = TRUE;
    `;
    
    if (producto.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: `No se encontró el producto con ID ${id}`
      });
    }
    
    let precioTotal = producto[0].precio_base;
    const detallePrecios = [{
      concepto: 'Precio base',
      precio: producto[0].precio_base
    }];
    
    // Calcular precios de ingredientes extras
    if (ingredientes_personalizados && ingredientes_personalizados.length > 0) {
      for (const ingrediente of ingredientes_personalizados) {
        if (ingrediente.es_extra) {
          const ingredienteInfo = await sql`
            SELECT * FROM ingredientes
            WHERE id_ingrediente = ${ingrediente.id_ingrediente};
          `;
          
          if (ingredienteInfo.length > 0) {
            const costoExtra = ingredienteInfo[0].precio * ingrediente.cantidad;
            precioTotal += costoExtra;
            detallePrecios.push({
              concepto: `Extra ${ingredienteInfo[0].nombre} (${ingrediente.cantidad} ${ingredienteInfo[0].unidad_medida})`,
              precio: costoExtra
            });
          }
        }
      }
    }
    
    res.json({
      status: 'OK',
      data: {
        producto: producto[0].nombre,
        precio_total: precioTotal,
        detalle_precios: detallePrecios
      }
    });
  } catch (error) {
    console.error(`Error al calcular precio del producto ${id}:`, error);
    res.status(500).json({
      status: 'ERROR',
      message: `Error al calcular precio del producto`,
      error: error.message
    });
  }
});

// Iniciar el servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  
  // Verificar la conexión a la base de datos al iniciar
  await testConnection();
  
  // Cerrar el proceso si no se puede conectar a la base de datos
  process.on('SIGINT', async () => {
    console.log('Cerrando conexiones a la base de datos...');
    await sql.end();
    process.exit(0);
  });
});

export default app;