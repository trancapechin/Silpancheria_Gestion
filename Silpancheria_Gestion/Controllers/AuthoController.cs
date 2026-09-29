using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SilpanchariaApp.Models;
using SilpanchariaApp.Services;

namespace SilpanchariaApp.Controllers
{
    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class PerfilRequest
    {
        public string? NuevoUsername { get; set; }
        public string? NuevaPassword { get; set; }
        public string PasswordActual { get; set; } = "";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly SupabaseService _supabase;

        public AuthController(SupabaseService supabase)
        {
            _supabase = supabase;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest datos)
        {
            var respuesta = await _supabase.Cliente
                .From<Usuario>()
                .Filter("username", Supabase.Postgrest.Constants.Operator.Equals, datos.Username)
                .Get();

            var usuario = respuesta.Models.FirstOrDefault();

            if (usuario == null || usuario.Estado != "ACTIVO" ||
                !BCrypt.Net.BCrypt.Verify(datos.Password, usuario.PasswordHash))
            {
                return Unauthorized(new { mensaje = "Usuario o contraseña incorrectos" });
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Username)
            };
            var identidad = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identidad));

            return Ok(new { mensaje = "Sesión iniciada", username = usuario.Username, nombre = usuario.Nombre });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { mensaje = "Sesión cerrada" });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var id = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var respuesta = await _supabase.Cliente
                .From<Usuario>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Get();
            var usuario = respuesta.Models.FirstOrDefault();
            if (usuario == null) return Unauthorized();

            return Ok(new { username = usuario.Username, nombre = usuario.Nombre });
        }

        [Authorize]
        [HttpPut("perfil")]
        public async Task<IActionResult> ActualizarPerfil([FromBody] PerfilRequest datos)
        {
            var id = long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var respuesta = await _supabase.Cliente
                .From<Usuario>()
                .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, id.ToString())
                .Get();
            var usuario = respuesta.Models.FirstOrDefault();
            if (usuario == null) return Unauthorized();

            // SIEMPRE se exige la contraseña actual antes de cualquier cambio
            if (!BCrypt.Net.BCrypt.Verify(datos.PasswordActual, usuario.PasswordHash))
            {
                return BadRequest(new { mensaje = "La contraseña actual no es correcta" });
            }

            bool cambios = false;

            if (!string.IsNullOrWhiteSpace(datos.NuevoUsername) && datos.NuevoUsername != usuario.Username)
            {
                var existente = await _supabase.Cliente
                    .From<Usuario>()
                    .Filter("username", Supabase.Postgrest.Constants.Operator.Equals, datos.NuevoUsername)
                    .Get();
                if (existente.Models.Any())
                    return BadRequest(new { mensaje = "Ese nombre de usuario ya está en uso" });

                usuario.Username = datos.NuevoUsername;
                cambios = true;
            }

            if (!string.IsNullOrWhiteSpace(datos.NuevaPassword))
            {
                usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(datos.NuevaPassword);
                cambios = true;
            }

            if (!cambios)
                return BadRequest(new { mensaje = "No se indicaron cambios" });

            await _supabase.Cliente.From<Usuario>().Update(usuario);

            // Refresca la cookie con el nuevo username
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Username)
            };
            var identidad = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identidad));

            return Ok(new { mensaje = "Perfil actualizado", username = usuario.Username });
        }
    }
}