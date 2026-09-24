using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("empleados")]
    public class Empleado : BaseModel
    {
        [PrimaryKey("id", false)]
        public long Id { get; set; }

        [Column("persona_id")]
        public long PersonaId { get; set; }

        [Column("numero_empleado")]
        public string NumeroEmpleado { get; set; }

        [Column("cargo")]
        public string Cargo { get; set; }

        [Column("salario")]
        public decimal Salario { get; set; }

        [Column("estado")]
        public string Estado { get; set; }
    }
}