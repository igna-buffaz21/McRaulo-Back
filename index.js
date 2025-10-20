import express from 'express';
import dotenv from 'dotenv';
import sql, { testConnection } from './config/db.js';
import pedidoRouter from './Router/pedidosR.js'; 
import productoRouter from './Router/productosR.js';
import ingredientesRouter from './Router/ingredientesR.js';
import clientesRouter from './Router/clientesR.js'
import PaymentRouter from './Router/paymentR.js';
import cors from "cors";

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express(); //te levanta un servidor http //se usa una sola vez en toda la app
const PORT = process.env.PORT; 

app.use(cors({
  origin: '*', // Permitir todas las IPs
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Encabezados permitidos
}))

// Middleware para parsear JSON
app.use(express.json()); ///todas las respuestas se devuelven en json

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

app.use('/api/clientes', clientesRouter);

app.use('/api/payment', PaymentRouter);

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