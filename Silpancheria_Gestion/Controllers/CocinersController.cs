using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CocinersController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public CocinersController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerCocineros()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Cocinero>()
                    .Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener cocineros", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearCocinero([FromBody] Cocinero cocinero)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Cocinero>()
                    .Insert(cocinero);
                return Created("", respuesta.Models?.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear cocinero", error = ex.Message });
            }
        }
    }
}
