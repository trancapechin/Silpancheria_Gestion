using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("personas")]
    public class Persona : BaseModel
    {
        [PrimaryKey("id", false)]
        public long Id { get; set; }

        [Column("nombre_completo")]
        public string NombreCompleto { get; set; }

        [Column("cedula")]
        public string Cedula { get; set; }

        [Column("email")]
        public string Email { get; set; }

        [Column("telefono")]
        public string Telefono { get; set; }

        [Column("estado")]
        public string Estado { get; set; }
    }
}