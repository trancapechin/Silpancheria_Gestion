using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly SupabaseService _supabaseService;

        public ReportesController(SupabaseService supabaseService)
        {
            _supabaseService = supabaseService;
        }

        // GET: api/Reportes/resumen
        [HttpGet("resumen")]
        public async Task<IActionResult> GetResumen()
        {
            try
            {
                var compras = await _supabaseService.Cliente.From<Compra>().Get();
                var proveedores = await _supabaseService.Cliente.From<Proveedor>().Get();
                var recetas = await _supabaseService.Cliente.From<Receta>().Get();
                var movimientos = await _supabaseService.Cliente.From<Movimiento>().Get();

                var resumen = new ReporteResumenDto
                {
                    TotalCompras = compras.Models.Count,
                    MontoTotalCompras = compras.Models.Sum(c => c.Total),
                    TotalProveedores = proveedores.Models.Count,
                    TotalRecetas = recetas.Models.Count,
                    TotalMovimientos = movimientos.Models.Count,
                    FechaGeneracion = DateTime.Now
                };

                return Ok(resumen);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }
    }
}