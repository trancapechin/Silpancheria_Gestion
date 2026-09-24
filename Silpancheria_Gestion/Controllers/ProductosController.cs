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

        // GET: api/productos/por-codigo/{codigo}
        [HttpGet("por-codigo/{codigo}")]
        public async Task<IActionResult> ObtenerPorCodigo(string codigo)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Producto>()
                    .Where(p => p.CodigoBarras == codigo)
                    .Get();

                var producto = respuesta.Models.FirstOrDefault();

                if (producto == null)
                    return NotFound(new { mensaje = "Producto no encontrado con ese código de barras" });

                return Ok(producto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al buscar por código de barras",
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

        // GET: api/productos/reporte-valorizacion
        [HttpGet("reporte-valorizacion")]
        public async Task<IActionResult> ReporteValorizacion()
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Producto>().Get();
                var productos = respuesta.Models;

                var detalle = productos.Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Tipo,
                    p.CodigoBarras,
                    p.Stock,
                    p.StockMinimo,
                    p.UnidadMedida,
                    Precio = p.Precio ?? 0,
                    ValorTotal = (p.Stock) * (p.Precio ?? 0),
                    EstadoStock = p.Stock <= p.StockMinimo ? "STOCK BAJO" : "NORMAL"
                }).ToList();

                var resumen = new
                {
                    TotalProductos = productos.Count,
                    ProductosStockBajo = productos.Count(p => p.Stock <= p.StockMinimo),
                    ValorTotalInventario = detalle.Sum(d => d.ValorTotal),
                    Detalle = detalle
                };

                return Ok(resumen);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al generar valorización", error = ex.Message });
            }
        }

        // GET: api/productos/reporte-rotacion
        // Usa movimientos_stock para calcular salidas en los últimos N días
        [HttpGet("reporte-rotacion")]
        public async Task<IActionResult> ReporteRotacion([FromQuery] int dias = 30)
        {
            try
            {
                var fechaDesde = DateTime.UtcNow.AddDays(-dias);

                var movs = await _supabase.Cliente
                    .From<Movimiento>()
                    .Get();

                var salidas = movs.Models
                    .Where(m => m.Tipo != null &&
                                (m.Tipo.ToUpper().Contains("SALIDA") || m.Tipo.ToUpper().Contains("MERMA") || m.Tipo.ToUpper().Contains("VENTA")) &&
                                m.Fecha >= fechaDesde)
                    .GroupBy(m => m.IdProducto)
                    .Select(g => new
                    {
                        IdProducto = g.Key,
                        CantidadSalida = g.Sum(x => x.Cantidad),
                        NumMovimientos = g.Count()
                    })
                    .ToList();

                var productos = (await _supabase.Cliente.From<Producto>().Get()).Models;

                var resultado = productos.Select(p =>
                {
                    var s = salidas.FirstOrDefault(x => x.IdProducto == p.Id);
                    return new
                    {
                        p.Id,
                        p.Nombre,
                        p.Tipo,
                        p.Stock,
                        p.UnidadMedida,
                        CantidadSalida = s?.CantidadSalida ?? 0,
                        NumMovimientos = s?.NumMovimientos ?? 0,
                        DiasAnalizados = dias
                    };
                })
                .OrderByDescending(x => x.CantidadSalida)
                .ToList();

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al generar rotación", error = ex.Message });
            }
        }
    }
}