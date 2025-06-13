import sql from '../config/db.js';  // Importar la conexión

async function obtenerTodoslosClientes() {
    try {
        const clientes = await sql`
        SELECT * FROM cliente;
        `;

        return clientes
    }
    catch (error) {
        throw new Error('Error en obtener los clientes' + error);
    }
}

export default {
    obtenerTodoslosClientes
}
