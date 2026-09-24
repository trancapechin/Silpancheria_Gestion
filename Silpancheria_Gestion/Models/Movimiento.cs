using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("movimientos")]
    public class Movimiento : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("id_producto")]
        public long? IdProducto { get; set; }

        [Column("id_almacen")]
        public long? IdAlmacen { get; set; }

        [Column("tipo")]
        public string Tipo { get; set; } = string.Empty;

        [Column("cantidad")]
        public decimal Cantidad { get; set; }

        [Column("fecha")]
        public DateTime? Fecha { get; set; }

        [Column("observaciones")]
        public string? Observaciones { get; set; }

        [Column("estado")]
        public string Estado { get; set; } = "ACTIVO";
    }
}