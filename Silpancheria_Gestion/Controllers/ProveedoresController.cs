using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public ProveedoresController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        // GET: api/proveedores
        [HttpGet]
        public async Task<IActionResult> ObtenerProveedores()
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Proveedor>()
                    .Get();

                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener los proveedores",
                    error = ex.Message
                });
            }
        }

        // GET: api/proveedores/1
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerProveedor(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Proveedor>()
                    .Where(p => p.Id == id)
                    .Get();

                var proveedor = respuesta.Models.FirstOrDefault();

                if (proveedor == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Proveedor no encontrado"
                    });
                }

                return Ok(proveedor);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al obtener el proveedor",
                    error = ex.Message
                });
            }
        }

        // POST: api/proveedores
        [HttpPost]
        public async Task<IActionResult> CrearProveedor(
            [FromBody] Proveedor proveedor)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Proveedor>()
                    .Insert(proveedor);

                return Ok(respuesta.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al crear el proveedor",
                    error = ex.Message
                });
            }
        }

        // PUT: api/proveedores/1
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProveedor(
            long id,
            [FromBody] Proveedor proveedor)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Proveedor>()
                    .Where(p => p.Id == id)
                    .Get();

                var proveedorExistente = respuesta.Models.FirstOrDefault();

                if (proveedorExistente == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Proveedor no encontrado"
                    });
                }

                proveedor.Id = id;

                var resultado = await _supabase.Cliente
                    .From<Proveedor>()
                    .Update(proveedor);

                return Ok(resultado.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al actualizar el proveedor",
                    error = ex.Message
                });
            }
        }

        // DELETE: api/proveedores/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProveedor(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Proveedor>()
                    .Where(p => p.Id == id)
                    .Get();

                var proveedor = respuesta.Models.FirstOrDefault();

                if (proveedor == null)
                {
                    return NotFound(new
                    {
                        mensaje = "Proveedor no encontrado"
                    });
                }

                await _supabase.Cliente
                    .From<Proveedor>()
                    .Where(p => p.Id == id)
                    .Delete();

                return Ok(new
                {
                    mensaje = "Proveedor eliminado correctamente"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error al eliminar el proveedor",
                    error = ex.Message
                });
            }
        }
    }
}