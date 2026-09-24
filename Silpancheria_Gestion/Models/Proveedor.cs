using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("proveedores")]
    public class Proveedor : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Column("nit")]
        public string Nit { get; set; } = string.Empty;

        [Column("contacto")]
        public string? Contacto { get; set; }

        [Column("telefono")]
        public string? Telefono { get; set; }

        [Column("direccion")]
        public string? Direccion { get; set; }

        [Column("estado")]
        public string Estado { get; set; } = "ACTIVO";
    }
}