using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MovimientosController : ControllerBase
    {
        private readonly SupabaseService _supabaseService;

        public MovimientosController(SupabaseService supabaseService)
        {
            _supabaseService = supabaseService;
        }

        // GET: api/Movimientos
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Movimiento>().Get();
                return Ok(response.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // GET: api/Movimientos/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Movimiento>()
                    .Where(m => m.Id == id)
                    .Single();

                if (response == null) return NotFound(new { mensaje = "Movimiento no encontrado" });
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // POST: api/Movimientos
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Movimiento movimiento)
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Movimiento>().Insert(movimiento);
                var nuevo = response.Models.FirstOrDefault();
                return Ok(nuevo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // PUT: api/Movimientos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] Movimiento movimiento)
        {
            try
            {
                movimiento.Id = id;
                var response = await _supabaseService.Cliente.From<Movimiento>()
                    .Where(m => m.Id == id)
                    .Update(movimiento);

                var actualizado = response.Models.FirstOrDefault();
                if (actualizado == null) return NotFound(new { mensaje = "Movimiento no encontrado para actualizar" });

                return Ok(actualizado);
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // DELETE: api/Movimientos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                await _supabaseService.Cliente.From<Movimiento>()
                    .Where(m => m.Id == id)
                    .Delete();

                return Ok(new { mensaje = "Movimiento eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }
    }
}