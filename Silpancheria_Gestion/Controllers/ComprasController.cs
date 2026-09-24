using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComprasController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public ComprasController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerCompras()
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Compra>().Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener las compras", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerCompra(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Compra>().Where(c => c.Id == id).Get();
                var compra = respuesta.Models.FirstOrDefault();
                if (compra == null) return NotFound(new { mensaje = "Compra no encontrada" });
                return Ok(compra);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener la compra", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearCompra([FromBody] CompraRequest request)
        {
            try
            {
                // 1. Guardar la cabecera de la compra
                var nuevaCompra = new Compra
                {
                    ProveedorId = request.ProveedorId,
                    AlmacenId = request.AlmacenId,
                    NumeroFactura = request.NumeroFactura,
                    Total = request.Total,
                    Estado = string.IsNullOrEmpty(request.Estado) ? "COMPLETADO" : request.Estado,
                    FechaCompra = DateTime.UtcNow
                };

                var respuestaCompra = await _supabase.Cliente.From<Compra>().Insert(nuevaCompra);
                var compraGuardada = respuestaCompra.Models.FirstOrDefault();

                if (compraGuardada == null)
                {
                    return StatusCode(500, new { mensaje = "Error al crear la cabecera de la compra" });
                }

                // 2. Guardar el detalle de la compra si existen ítems
                if (request.Detalles != null && request.Detalles.Count > 0)
                {
                    var detalles = request.Detalles.Select(d => new DetalleCompra
                    {
                        CompraId = compraGuardada.Id,
                        ProductoId = d.ProductoId,
                        Cantidad = d.Cantidad,
                        PrecioUnitario = d.PrecioUnitario,
                        Subtotal = d.Cantidad * d.PrecioUnitario
                    }).ToList();

                    await _supabase.Cliente.From<DetalleCompra>().Insert(detalles);
                }

                return Ok(compraGuardada);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear la compra", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarCompra(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Compra>().Where(c => c.Id == id).Get();
                if (respuesta.Models.FirstOrDefault() == null) return NotFound(new { mensaje = "Compra no encontrada" });

                await _supabase.Cliente.From<Compra>().Where(c => c.Id == id).Delete();
                return Ok(new { mensaje = "Compra eliminada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar la compra", error = ex.Message });
            }
        }
    }

    // DTOs para la recepción de los datos enviados desde JavaScript
    public class CompraRequest
    {
        public long? ProveedorId { get; set; }
        public long? AlmacenId { get; set; }
        public string? NumeroFactura { get; set; }
        public decimal Total { get; set; }
        public string? Estado { get; set; }
        public List<DetalleCompraRequest> Detalles { get; set; } = new List<DetalleCompraRequest>();
    }

    public class DetalleCompraRequest
    {
        public long ProductoId { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}