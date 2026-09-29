using Microsoft.AspNetCore.Authentication.Cookies;
using SilpanchariaApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Agregar servicios
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- 1. CONFIGURAR CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTodo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Registrar Supabase
builder.Services.AddSingleton<SupabaseService>();

// --- LOGIN CON COOKIE ---
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "silpancharia.auth";
        options.Cookie.HttpOnly = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;

        // Como es una API, en vez de redirigir devolvemos 401 / 403
        options.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Inicializar Supabase
var supabase = app.Services.GetRequiredService<SupabaseService>();
await supabase.Inicializar();

// --- Crear usuario administrador si no existe ninguno ---
using (var scope = app.Services.CreateScope())
{
    var respuesta = await supabase.Cliente.From<SilpanchariaApp.Models.Usuario>().Get();
    if (!respuesta.Models.Any())
    {
        var admin = new SilpanchariaApp.Models.Usuario
        {
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Nombre = "Administrador",
            Estado = "ACTIVO"
        };
        await supabase.Cliente.From<SilpanchariaApp.Models.Usuario>().Insert(admin);
        Console.WriteLine("Usuario admin creado. Usuario: admin / Contraseña: admin123");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// --- 2. HABILITAR CORS Y ARCHIVOS ESTÁTICOS ---
app.UseCors("PermitirTodo");
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();