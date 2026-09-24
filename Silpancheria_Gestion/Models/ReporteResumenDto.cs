using System;

namespace SilpanchariaApp.Models
{
    public class ReporteResumenDto
    {
        public int TotalCompras { get; set; }
        public decimal MontoTotalCompras { get; set; }
        public int TotalProveedores { get; set; }
        public int TotalRecetas { get; set; }
        public int TotalMovimientos { get; set; }
        public DateTime FechaGeneracion { get; set; } = DateTime.Now;
    }
}