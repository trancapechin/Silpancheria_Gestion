using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public CategoriasController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerCategorias()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Categoria>()
                    .Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener categorías", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearCategoria([FromBody] Categoria categoria)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Categoria>()
                    .Insert(categoria);
                return Created("", respuesta.Models?.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear categoría", error = ex.Message });
            }
        }
    }
}
