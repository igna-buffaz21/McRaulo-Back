import express from 'express';
import productosController from '../Controllers/productosController.js';

const router = express.Router(); // Permite crear rutas para manejar las peticiones HTTP relacionadas con los productos

router.get('/obtenerProductos', productosController.obtenerProductos);
router.get('/obtenerProductoEspecificoConIngredientes/:id', productosController.obtenerProductoEspecificoConIngredientes);
//router.get('/obtenerProductoPorCategoria/:categoria', productosController.obtenerProductoPorCategoria);
//router.post('/api/productos/:id/calcular-precio', productosController.calcularPrecioProductoPersonalizado);
router.get('/obtenerIngredientesParaModificar/:id', productosController.obtenerIngredientesParaModificar);

export default router;