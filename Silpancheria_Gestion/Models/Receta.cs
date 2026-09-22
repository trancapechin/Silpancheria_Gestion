using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace SilpanchariaApp.Models
{
    [Table("recetas")]
    public class Receta : BaseModel
    {
        [PrimaryKey("id")]
        public long Id { get; set; }

        [Column("id_plato")]
        public long IdPlato { get; set; }

        [Column("id_ingrediente")]
        public long IdIngrediente { get; set; }

        [Column("cantidad")]
        public decimal Cantidad { get; set; }

        [Column("unidad_medida")]
        public string UnidadMedida { get; set; }
    }
}