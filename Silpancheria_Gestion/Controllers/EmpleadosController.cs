using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace Silpancheria_Gestion.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmpleadosController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public EmpleadosController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerEmpleados()
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Empleado>().Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener los empleados", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerEmpleado(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Empleado>().Where(e => e.Id == id).Get();
                var empleado = respuesta.Models.FirstOrDefault();
                if (empleado == null) return NotFound(new { mensaje = "Empleado no encontrado" });
                return Ok(empleado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener el empleado", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearEmpleado([FromBody] Empleado empleado)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Empleado>().Insert(empleado);
                return Ok(respuesta.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear el empleado", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarEmpleado(long id, [FromBody] Empleado empleado)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Empleado>().Where(e => e.Id == id).Get();
                if (respuesta.Models.FirstOrDefault() == null) return NotFound(new { mensaje = "Empleado no encontrado" });

                empleado.Id = id;
                var resultado = await _supabase.Cliente.From<Empleado>().Update(empleado);
                return Ok(resultado.Models.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al actualizar el empleado", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarEmpleado(long id)
        {
            try
            {
                var respuesta = await _supabase.Cliente.From<Empleado>().Where(e => e.Id == id).Get();
                if (respuesta.Models.FirstOrDefault() == null) return NotFound(new { mensaje = "Empleado no encontrado" });

                await _supabase.Cliente.From<Empleado>().Where(e => e.Id == id).Delete();
                return Ok(new { mensaje = "Empleado eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar el empleado", error = ex.Message });
            }
        }
    }
}