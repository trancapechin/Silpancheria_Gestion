using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
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
                var respuesta = await _supabase.Cliente
                    .From<Empleado>()
                    .Get();
                return Ok(respuesta.Models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener empleados", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearEmpleado([FromBody] Empleado empleado)
        {
            try
            {
                var respuesta = await _supabase.Cliente
                    .From<Empleado>()
                    .Insert(empleado);
                return Created("", respuesta.Models?.FirstOrDefault());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al crear empleado", error = ex.Message });
            }
        }
    }
}
