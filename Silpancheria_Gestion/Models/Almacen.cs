using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("almacenes")]
    public class Almacen : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("nombre")]
        public string Nombre { get; set; }

        [Column("ubicacion")]
        public string Ubicacion { get; set; }

        [Column("estado")]
        public string Estado { get; set; }
    }
}