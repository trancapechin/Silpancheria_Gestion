using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("detalle_compra")]
    public class DetalleCompra : BaseModel
    {
        [PrimaryKey("id", false)]
        public long Id { get; set; }

        [Column("compra_id")]
        public long CompraId { get; set; }

        [Column("producto_id")]
        public long ProductoId { get; set; }

        [Column("cantidad")]
        public decimal Cantidad { get; set; }

        [Column("precio_unitario")]
        public decimal PrecioUnitario { get; set; }

        [Column("subtotal")]
        public decimal Subtotal { get; set; }
    }
}