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

var app = builder.Build();

// Inicializar Supabase
var supabase = app.Services.GetRequiredService<SupabaseService>();
await supabase.Inicializar();

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

app.UseAuthorization();
app.MapControllers();

app.Run();