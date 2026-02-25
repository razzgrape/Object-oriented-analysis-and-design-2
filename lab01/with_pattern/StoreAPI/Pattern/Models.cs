namespace StoreAPI.Pattern
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
    }

    public class OrderItem
    {
        public Product Product { get; set; } = new();
        public int Quantity { get; set; }
        public decimal GetTotal() => Product.Price * Quantity;
    }

    public class Order
    {
        public int Id { get; set; }
        public List<OrderItem> Items { get; set; } = new();
        public decimal GetSubTotal() => Items.Sum(i => i.GetTotal());
    }
}