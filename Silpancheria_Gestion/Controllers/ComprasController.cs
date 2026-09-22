using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComprasController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public ComprasController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        // GET: api/compras
        [HttpGet]
        public async Task<IActionResult> ObtenerCompras()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Compra>()
                    .Get();

                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener las compras",
                    error = ex.Message
                });
            }
        }

        // POST: api/compras
        [HttpPost]
        public async Task<IActionResult> CrearCompra([FromBody] Compra compra)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Compra>()
                    .Insert(compra);

                return Ok(respuesta.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al crear la compra",
                    error = ex.Message
                });
            }
        }

        // PUT: api/compras/2/confirmar
        [HttpPut("{id}/confirmar")]
        public async Task<IActionResult> ConfirmarCompra(long id)
        {
            try
            {
                var parametros = new Dictionary<string, object>
                {
                    { "p_id_compra", id }
                };

                var resultado = await _supabase.Cliente
                    .Rpc("confirmar_compra", parametros);

                return Ok(new
                {
                    mensaje = resultado
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    mensaje = "No se pudo confirmar la compra",
                    error = ex.Message
                });
            }
        }
    }
}