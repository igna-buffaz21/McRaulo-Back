// db.js
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Detectar si es una URL de Render
const isRender = process.env.DATABASE_URL.includes('render.com');

// Opciones de configuración para la conexión
const options = {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 30,
  ssl: isRender ? { rejectUnauthorized: false } : false, // 👈 ESTE CAMBIO
  onnotice: () => {},
  debug: process.env.NODE_ENV === 'development',
  max_lifetime: 60 * 30,
  retry_limit: 3,
  connection: {
    application_name: 'autoservicio-burgers-api',
  },
};

// Validar variable de entorno
if (!process.env.DATABASE_URL) {
  console.error('❌ La variable de entorno DATABASE_URL no está definida');
  process.exit(1);
}

console.log(`🔌 Intentando conectar a ${isRender ? 'Render.com' : 'PostgreSQL local'}...`);

// Ocultar la contraseña en los logs
const safeUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@');
console.log(`🔗 URL: ${safeUrl}`);

// Crear conexión a la base de datos
const sql = postgres(process.env.DATABASE_URL, options);

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const result = await sql`SELECT NOW() as time`;
    console.log('✅ Conexión exitosa a la base de datos');
    console.log(`📅 Fecha y hora del servidor: ${result[0].time}`);

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    if (tables.length === 0) {
      console.log('📋 No se encontraron tablas en el esquema público');
    } else {
      console.log('📋 Tablas disponibles:');
      tables.forEach((table, i) => console.log(`   ${i + 1}. ${table.table_name}`));
    }

    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    if (error.code) console.error(`📋 Código de error: ${error.code}`);
    return false;
  }
};

export default sql;
