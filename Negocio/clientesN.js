import clientesAD from "../AccesoDatos/clientesAD.js";

async function obtenerTodoslosClientes() {
    const clientes = await clientesAD.obtenerTodoslosClientes();
    return clientes;
}

export default {
    obtenerTodoslosClientes
}

