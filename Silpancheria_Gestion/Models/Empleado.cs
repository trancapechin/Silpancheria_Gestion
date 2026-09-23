using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("empleados")]
    public class Empleado : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("id_persona")]
        public long IdPersona { get; set; }

        [Column("numero_empleado")]
        public string NumeroEmpleado { get; set; }

        [Column("cargo")]
        public string Cargo { get; set; }

        [Column("departamento")]
        public string Departamento { get; set; }

        [Column("fecha_ingreso")]
        public DateTime FechaIngreso { get; set; }

        [Column("salario")]
        public decimal Salario { get; set; }

        [Column("estado")]
        public string Estado { get; set; }
    }
}
