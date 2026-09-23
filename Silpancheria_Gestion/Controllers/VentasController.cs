using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VentasController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public VentasController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerVentas()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Venta>()
                    .Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener ventas", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearVenta([FromBody] Venta venta)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Venta>()
                    .Insert(venta);
                return Created("", respuesta.Models?.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear venta", error = ex.Message });
            }
        }
    }
}
