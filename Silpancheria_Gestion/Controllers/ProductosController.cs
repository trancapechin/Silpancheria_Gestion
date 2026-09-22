using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public ProductosController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        // GET: api/productos
        [HttpGet]
        public async Task<IActionResult> ObtenerProductos()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Producto>()
                    .Get();

                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener los productos",
                    error = ex.Message
                });
            }
        }

        // GET: api/productos/1
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerProducto(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Producto>()
                    .Where(p => p.Id == id)
                    .Get();

                var producto = respuesta.Models.FirstOrDefault();

                if (producto == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Producto no encontrado"
                    });
                }

                return Ok(producto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener el producto",
                    error = ex.Message
                });
            }
        }

        // GET: api/productos/stock-bajo
        [HttpGet("stock-bajo")]
        public async Task<IActionResult> ObtenerStockBajo()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Producto>()
                    .Get();

                var productos = respuesta.Models
                    .Where(p => p.Stock <= p.StockMinimo)
                    .ToList();

                return Ok(productos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener productos con stock bajo",
                    error = ex.Message
                });
            }
        }

        // GET: api/productos/reporte-inventario
        [HttpGet("reporte-inventario")]
        public async Task<IActionResult> ReporteInventario()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Producto>()
                    .Get();

                var reporte = respuesta.Models
                    .Select(p => new
                    {
                        p.Id,
                        p.Nombre,
                        p.Tipo,
                        p.Stock,
                        p.StockMinimo,
                        p.UnidadMedida,
                        EstadoStock = p.Stock <= p.StockMinimo
                            ? "STOCK BAJO"
                            : "NORMAL"
                    })
                    .ToList();

                return Ok(reporte);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al generar reporte",
                    error = ex.Message
                });
            }
        }

        // POST: api/productos
        [HttpPost]
        public async Task<IActionResult> CrearProducto([FromBody] Producto producto)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Producto>()
                    .Insert(producto);

                return Ok(respuesta.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al crear el producto",
                    error = ex.Message
                });
            }
        }

        // PUT: api/productos/1
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProducto(
            long id,
            [FromBody] Producto producto)
        {
            try
            {
                // Verificar que el producto exista
                var respuesta = await _supabase.Cliente
                    .From<Producto>()
                    .Where(p => p.Id == id)
                    .Get();

                var productoExistente = respuesta.Models.FirstOrDefault();

                if (productoExistente == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Producto no encontrado"
                    });
                }

                // Mantener el ID original
                producto.Id = id;

                // Actualizar
                var resultado = await _supabase.Cliente
                    .From<Producto>()
                    .Update(producto);

                return Ok(resultado.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al actualizar el producto",
                    error = ex.Message
                });
            }
        }

        // DELETE: api/productos/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProducto(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Producto>()
                    .Where(p => p.Id == id)
                    .Get();

                var producto = respuesta.Models.FirstOrDefault();

                if (producto == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Producto no encontrado"
                    });
                }

                await _supabase.Cliente
                    .From<Producto>()
                    .Where(p => p.Id == id)
                    .Delete();

                return Ok(new
                {
                    mensaje = "Producto eliminado correctamente"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al eliminar el producto",
                    error = ex.Message
                });
            }
        }
    }
}