using System;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("compras")]
    public class Compra : BaseModel
    {
        [PrimaryKey("id", false)]
        public long Id { get; set; }

        [Column("proveedor_id")]
        public long? ProveedorId { get; set; }

        [Column("almacen_id")]
        public long? AlmacenId { get; set; }

        [Column("numero_factura")]
        public string? NumeroFactura { get; set; }

        [Column("fecha_compra")]
        public DateTime FechaCompra { get; set; } = DateTime.UtcNow;

        [Column("total")]
        public decimal Total { get; set; }

        [Column("estado")]
        public string Estado { get; set; } = "COMPLETADO";
    }
}