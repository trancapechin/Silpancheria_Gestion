using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("compras")]
    public class Compra : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("id_proveedor")]
        public long IdProveedor { get; set; }

        [Column("fecha")]
        public DateTime Fecha { get; set; }

        [Column("estado")]
        public string Estado { get; set; }

        [Column("total")]
        public decimal Total { get; set; }
    }
}