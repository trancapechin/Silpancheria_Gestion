using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonasController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public PersonasController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPersonas()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Persona>()
                    .Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener personas", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearPersona([FromBody] Persona persona)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Persona>()
                    .Insert(persona);
                return Created("", respuesta.Models?.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear persona", error = ex.Message });
            }
        }
    }
}
