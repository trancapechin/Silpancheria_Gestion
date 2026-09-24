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
                var respuesta = await _supabase.Cliente.From<Persona>().Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener las personas", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPersona(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Persona>().Where(p => p.Id == id).Get();
                var persona = respuesta.Models.FirstOrDefault();
                if (persona == null) return NotFound(new { mensaje = "Persona no encontrada" });
                return Ok(persona);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener la persona", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearPersona([FromBody] Persona persona)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Persona>().Insert(persona);
                return Ok(respuesta.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear la persona", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarPersona(long id, [FromBody] Persona persona)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Persona>().Where(p => p.Id == id).Get();
                if (respuesta.Models.FirstOrDefault() == null) return NotFound(new { mensaje = "Persona no encontrada" });

                persona.Id = id;
                var resultado = await _supabase.Cliente.From<Persona>().Update(persona);
                return Ok(resultado.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al actualizar la persona", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarPersona(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Persona>().Where(p => p.Id == id).Get();
                if (respuesta.Models.FirstOrDefault() == null) return NotFound(new { mensaje = "Persona no encontrada" });

                await _supabase.Cliente.From<Persona>().Where(p => p.Id == id).Delete();
                return Ok(new { mensaje = "Persona eliminada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar la persona", error = ex.Message });
            }
        }
    }
}