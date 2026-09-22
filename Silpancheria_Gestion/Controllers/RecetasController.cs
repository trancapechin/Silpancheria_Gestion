using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecetasController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public RecetasController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        // GET: api/recetas
        [HttpGet]
        public async Task<IActionResult> ObtenerRecetas()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Receta>()
                    .Get();

                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener las recetas",
                    error = ex.Message
                });
            }
        }

        // GET: api/Recetas/1
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerReceta(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Receta>()
                    .Where(r => r.Id == id)
                    .Get();

                var receta = respuesta.Models.FirstOrDefault();

                if (receta == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Receta no encontrada"
                    });
                }

                return Ok(receta);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener la receta",
                    error = ex.Message
                });
            }
        }

        // POST: api/recetas
        [HttpPost]
        public async Task<IActionResult> CrearReceta(
            [FromBody] Receta receta)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Receta>()
                    .Insert(receta);

                return Ok(respuesta.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al crear la receta",
                    error = ex.Message
                });
            }
        }

        // PUT: api/Recetas/1
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarReceta(
            long id,
            [FromBody] Receta receta)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Receta>()
                    .Where(r => r.Id == id)
                    .Get();

                var recetaExistente = respuesta.Models.FirstOrDefault();

                if (recetaExistente == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Receta no encontrada"
                    });
                }

                receta.Id = id;

                var resultado = await _supabase.Cliente
                    .From<Receta>()
                    .Update(receta);

                return Ok(resultado.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al actualizar la receta",
                    error = ex.Message
                });
            }
        }

        // PUT: api/recetas/preparar/5?cantidad=5
        [HttpPut("preparar/{idPlato}")]
        public async Task<IActionResult> PrepararPlato(
            long idPlato,
            [FromQuery] decimal cantidad)
        {
            try
            {
                var parametros = new Dictionary<string, object>
                {
                    { "p_id_plato", idPlato },
                    { "p_cantidad_platos", cantidad }
                };

                var resultado = await _supabase.Cliente
                    .Rpc("preparar_plato", parametros);

                return Ok(new
                {
                    mensaje = resultado
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    mensaje = "No se pudo preparar el plato",
                    error = ex.Message
                });
            }
        }

        // DELETE: api/Recetas/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarReceta(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Receta>()
                    .Where(r => r.Id == id)
                    .Get();

                var receta = respuesta.Models.FirstOrDefault();

                if (receta == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Receta no encontrada"
                    });
                }

                await _supabase.Cliente
                    .From<Receta>()
                    .Where(r => r.Id == id)
                    .Delete();

                return Ok(new
                {
                    mensaje = "Receta eliminada correctamente"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al eliminar la receta",
                    error = ex.Message
                });
            }
        }
    }
}