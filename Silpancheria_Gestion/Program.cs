using SilpanchariaApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Agregar servicios
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

app.UseAuthorization();

app.MapControllers();

app.Run();