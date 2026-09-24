using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecetasController : ControllerBase
    {
        private readonly SupabaseService _supabaseService;

        public RecetasController(SupabaseService supabaseService)
        {
            _supabaseService = supabaseService;
        }

        // GET: api/Recetas
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Receta>().Get();
                return Ok(response.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // GET: api/Recetas/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Receta>()
                    .Where(r => r.Id == id)
                    .Single();

                if (response == null) return NotFound(new { mensaje = "Receta no encontrada" });
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // POST: api/Recetas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Receta receta)
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Receta>().Insert(receta);
                var nueva = response.Models.FirstOrDefault();
                return Ok(nueva);
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // PUT: api/Recetas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] Receta receta)
        {
            try
            {
                receta.Id = id;
                var response = await _supabaseService.Cliente.From<Receta>()
                    .Where(r => r.Id == id)
                    .Update(receta);

                var actualizada = response.Models.FirstOrDefault();
                if (actualizada == null) return NotFound(new { mensaje = "Receta no encontrada para actualizar" });

                return Ok(actualizada);
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // DELETE: api/Recetas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                await _supabaseService.Cliente.From<Receta>()
                    .Where(r => r.Id == id)
                    .Delete();

                return Ok(new { mensaje = "Receta eliminada correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }
    }
}