namespace Store.NoPattern
{
    public class RussianDelivery
    {
        public decimal Cost { get; set; } = 300;

        public string Deliver(Order order)
        {
            return $"Заказ #{order.Id} передан в СДЭК. Стоимость доставки: {Cost} ₽";
        }

        public decimal GetCost() => Cost;
    }

    public class USDelivery
    {
        public decimal Cost { get; set; } = 20;

        public string Deliver(Order order)
        {
            return $"Order #{order.Id} shipped via FedEx. Delivery cost: ${Cost}";
        }

        public decimal GetCost() => Cost;
    }
}
