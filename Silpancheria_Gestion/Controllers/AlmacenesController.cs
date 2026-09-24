using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlmacenesController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public AlmacenesController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerAlmacenes()
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Almacen>().Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener los almacenes", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerAlmacen(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Almacen>().Where(a => a.Id == id).Get();
                var almacen = respuesta.Models.FirstOrDefault();
                if (almacen == null) return NotFound(new { mensaje = "Almacén no encontrado" });
                return Ok(almacen);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener el almacén", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearAlmacen([FromBody] Almacen almacen)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Almacen>().Insert(almacen);
                return Ok(respuesta.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear el almacén", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarAlmacen(long id, [FromBody] Almacen almacen)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Almacen>().Where(a => a.Id == id).Get();
                if (respuesta.Models.FirstOrDefault() == null) return NotFound(new { mensaje = "Almacén no encontrado" });

                almacen.Id = id;
                var resultado = await _supabase.Cliente.From<Almacen>().Update(almacen);
                return Ok(resultado.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al actualizar el almacén", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarAlmacen(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Almacen>().Where(a => a.Id == id).Get();
                if (respuesta.Models.FirstOrDefault() == null) return NotFound(new { mensaje = "Almacén no encontrado" });

                await _supabase.Cliente.From<Almacen>().Where(a => a.Id == id).Delete();
                return Ok(new { mensaje = "Almacén eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar el almacén", error = ex.Message });
            }
        }
    }
}