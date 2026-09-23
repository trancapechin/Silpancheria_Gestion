using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("reportes")]
    public class Reporte : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("titulo")]
        public string Titulo { get; set; }

        [Column("descripcion")]
        public string Descripcion { get; set; }

        [Column("tipo")]
        public string Tipo { get; set; }

        [Column("fecha_generacion")]
        public DateTime FechaGeneracion { get; set; }

        [Column("fecha_desde")]
        public DateTime? FechaDesde { get; set; }

        [Column("fecha_hasta")]
        public DateTime? FechaHasta { get; set; }

        [Column("generado_por")]
        public long? GeneradoPor { get; set; }

        [Column("contenido")]
        public string Contenido { get; set; }

        [Column("estado")]
        public string Estado { get; set; }
    }
}
