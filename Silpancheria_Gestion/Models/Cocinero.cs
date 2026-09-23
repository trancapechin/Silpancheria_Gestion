using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("cocineros")]
    public class Cocinero : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("id_empleado")]
        public long IdEmpleado { get; set; }

        [Column("nivel_especialidad")]
        public string NivelEspecialidad { get; set; }

        [Column("especialidades")]
        public string Especialidades { get; set; }

        [Column("fecha_certificacion")]
        public DateTime? FechaCertificacion { get; set; }

        [Column("estado")]
        public string Estado { get; set; }
    }
}
