using Supabase;
namespace SilpanchariaApp.Services
{
    public class SupabaseService
    {
        private readonly Client _client;

        public SupabaseService(IConfiguration configuration)
        {
            string url = configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase:Url is not configured");
            string key = configuration["Supabase:ApiKey"] ?? throw new InvalidOperationException("Supabase:ApiKey is not configured");

            var options = new SupabaseOptions
            {
                AutoConnectRealtime = false
            };

            _client = new Client(url, key, options);
        }

        public async Task Inicializar()
        {
            await _client.InitializeAsync();
        }

        public Client Cliente
        {
            get { return _client; }
        }
    }
}