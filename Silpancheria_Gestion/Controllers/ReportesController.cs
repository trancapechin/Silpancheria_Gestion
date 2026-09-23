using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public ReportesController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerReportes()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Reporte>()
                    .Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener reportes", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearReporte([FromBody] Reporte reporte)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Reporte>()
                    .Insert(reporte);
                return Created("", respuesta.Models?.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear reporte", error = ex.Message });
            }
        }
    }
}
