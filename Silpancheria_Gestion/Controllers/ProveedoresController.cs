using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly SupabaseService _supabaseService;

        public ProveedoresController(SupabaseService supabaseService)
        {
            _supabaseService = supabaseService;
        }

        // Si tu SupabaseService tiene una propiedad llamada 'Cliente' o 'Client', 
        // úsala para acceder a la base de datos (ejemplo: _supabaseService.Cliente)

        // GET: api/Proveedores
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Proveedor>().Get();
                return Ok(response.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // GET: api/Proveedores/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Proveedor>()
                    .Where(p => p.Id == id)
                    .Single();

                if (response == null) return NotFound(new { mensaje = "Proveedor no encontrado" });
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = ex.Message });
            }
        }

        // POST: api/Proveedores
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Proveedor proveedor)
        {
            try
            {
                var response = await _supabaseService.Cliente.From<Proveedor>().Insert(proveedor);
                var nuevo = response.Models.FirstOrDefault();
                return Ok(nuevo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // PUT: api/Proveedores/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] Proveedor proveedor)
        {
            try
            {
                proveedor.Id = id;
                var response = await _supabaseService.Cliente.From<Proveedor>()
                    .Where(p => p.Id == id)
                    .Update(proveedor);

                var actualizado = response.Models.FirstOrDefault();
                if (actualizado == null) return NotFound(new { mensaje = "Proveedor no encontrado para actualizar" });

                return Ok(actualizado);
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // DELETE: api/Proveedores/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                await _supabaseService.Cliente.From<Proveedor>()
                    .Where(p => p.Id == id)
                    .Delete();

                return Ok(new { mensaje = "Proveedor eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }
    }
}