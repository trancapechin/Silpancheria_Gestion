using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("ventas")]
    public class Venta : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("numero_venta")]
        public string NumeroVenta { get; set; }

        [Column("fecha_venta")]
        public DateTime FechaVenta { get; set; }

        [Column("id_cliente")]
        public long? IdCliente { get; set; }

        [Column("monto_total")]
        public decimal MontoTotal { get; set; }

        [Column("metodo_pago")]
        public string MetodoPago { get; set; }

        [Column("estado")]
        public string Estado { get; set; }

        [Column("observaciones")]
        public string Observaciones { get; set; }
    }
}
