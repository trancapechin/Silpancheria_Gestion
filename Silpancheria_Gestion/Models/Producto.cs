using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("productos")]
    public class Producto : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("nombre")]
        public string Nombre { get; set; }

        [Column("tipo")]
        public string Tipo { get; set; }

        [Column("precio")]
        public decimal? Precio { get; set; }

        [Column("stock")]
        public decimal Stock { get; set; }

        [Column("stock_minimo")]
        public decimal StockMinimo { get; set; }

        [Column("unidad_medida")]
        public string UnidadMedida { get; set; }

        [Column("estado")]
        public string Estado { get; set; }

        // NUEVO: código de barras / RFID
        [Column("codigo_barras")]
        public string CodigoBarras { get; set; }

        // NUEVO: multi-almacén (del paso 2)
        [Column("almacen_id")]
        public long? AlmacenId { get; set; }
    }
}