using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("detalle_compra")]
    public class DetalleCompra : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("id_compra")]
        public long IdCompra { get; set; }

        [Column("id_producto")]
        public long IdProducto { get; set; }

        [Column("cantidad")]
        public decimal Cantidad { get; set; }

        [Column("precio_unitario")]
        public decimal PrecioUnitario { get; set; }

        [Column("subtotal")]
        public decimal Subtotal { get; set; }
    }
}