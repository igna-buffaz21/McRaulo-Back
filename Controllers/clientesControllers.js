import clientesN from "../Negocio/clientesN.js";

async function obtenerTodoslosClientes(req, res) {
    try {
        const clientes = await clientesN.obtenerTodoslosClientes();
        res.status(200).json(clientes);
    }
    catch (error) {
        res.status(500).json('Error al obtener clientes ' + error)
    }
}

export default {
    obtenerTodoslosClientes
}