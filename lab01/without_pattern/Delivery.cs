namespace Store.NoPattern
{
    public class RussianDelivery
    {
        public decimal Cost { get; set; } = 300;

        public void Deliver(Order order)
        {
            Console.WriteLine($"[Доставка РФ] Заказ #{order.Id} отправлен. Стоимость доставки: {Cost} руб.");
        }
    }

    public class USDelivery
    {
        public decimal Cost { get; set; } = 20;

        public void Deliver(Order order)
        {
            Console.WriteLine($"[US Delivery] Order #{order.Id} shipped. Delivery cost: ${Cost}");
        }
    }
}