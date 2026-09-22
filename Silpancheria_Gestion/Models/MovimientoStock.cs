using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("movimientos_stock")]
    public class MovimientoStock : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("id_producto")]
        public long IdProducto { get; set; }

        [Column("tipo")]
        public string Tipo { get; set; }

        [Column("cantidad")]
        public decimal Cantidad { get; set; }

        [Column("motivo")]
        public string Motivo { get; set; }

        [Column("fecha")]
        public DateTime Fecha { get; set; }
    }
}