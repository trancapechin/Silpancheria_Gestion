using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MovimientosStockController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public MovimientosStockController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerMovimientos()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<MovimientoStock>()
                    .Get();

                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener movimientos",
                    error = ex.Message
                });
            }
        }
    }
}