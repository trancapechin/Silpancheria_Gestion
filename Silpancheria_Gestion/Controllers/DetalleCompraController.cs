using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DetalleCompraController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public DetalleCompraController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        // GET: api/DetalleCompra
        [HttpGet]
        public async Task<IActionResult> ObtenerDetalles()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<DetalleCompra>()
                    .Get();

                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener los detalles",
                    error = ex.Message
                });
            }
        }

        // POST: api/DetalleCompra
        [HttpPost]
        public async Task<IActionResult> CrearDetalle(
            [FromBody] DetalleCompra detalle)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<DetalleCompra>()
                    .Insert(detalle);

                return Ok(respuesta.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al crear el detalle",
                    error = ex.Message
                });
            }
        }
    }
}