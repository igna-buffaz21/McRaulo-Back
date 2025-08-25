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