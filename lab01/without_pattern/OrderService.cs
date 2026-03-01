namespace Store.NoPattern
{
    // ПРОБЛЕМА БЕЗ ПАТТЕРНА:
    // OrderService знает о ВСЕХ конкретных классах.
    // При добавлении новой страны — нужно лезть сюда и менять этот класс.
    // Нарушается принцип Open/Closed (открыт для расширения, закрыт для изменения).

    public enum StoreRegion
    {
        Russia,
        USA
    }

    public class CheckoutResult
    {
        public decimal SubTotal { get; set; }
        public decimal Tax { get; set; }
        public string TaxDescription { get; set; } = "";
        public decimal DeliveryCost { get; set; }
        public string DeliveryMessage { get; set; } = "";
        public decimal Total { get; set; }
        public string PaymentMessage { get; set; } = "";
        public string Region { get; set; } = "";
    }

    public class OrderService
    {
        public CheckoutResult Checkout(Order order, StoreRegion region)
        {
            decimal subTotal = order.GetSubTotal();
            decimal tax = 0;
            string taxDescription = "";
            decimal deliveryCost = 0;
            string deliveryMessage = "";
            string paymentMessage = "";

            // Дублирующиеся if/switch — при добавлении новой страны
            // придётся добавлять ветку в КАЖДОМ switch

            // Считаем налог
            switch (region)
            {
                case StoreRegion.Russia:
                    var ruTax = new RussianTaxCalculator();
                    tax = ruTax.Calculate(subTotal);
                    taxDescription = ruTax.GetDescription(subTotal);
                    break;

                case StoreRegion.USA:
                    var usTax = new USTaxCalculator();
                    tax = usTax.Calculate(subTotal);
                    taxDescription = usTax.GetDescription(subTotal);
                    break;

                default:
                    throw new NotSupportedException($"Регион {region} не поддерживается");
            }

            // Выбираем доставку и доставляем
            switch (region)
            {
                case StoreRegion.Russia:
                    var ruDelivery = new RussianDelivery();
                    deliveryCost = ruDelivery.GetCost();
                    deliveryMessage = ruDelivery.Deliver(order);
                    break;

                case StoreRegion.USA:
                    var usDelivery = new USDelivery();
                    deliveryCost = usDelivery.GetCost();
                    deliveryMessage = usDelivery.Deliver(order);
                    break;

                default:
                    throw new NotSupportedException($"Регион {region} не поддерживается");
            }

            decimal total = subTotal + tax + deliveryCost;

            // Проводим оплату
            switch (region)
            {
                case StoreRegion.Russia:
                    var sbp = new SBPPayment();
                    paymentMessage = sbp.Pay(total);
                    break;

                case StoreRegion.USA:
                    var paypal = new PayPalPayment();
                    paymentMessage = paypal.Pay(total);
                    break;

                default:
                    throw new NotSupportedException($"Регион {region} не поддерживается");
            }

            return new CheckoutResult
            {
                SubTotal = subTotal,
                Tax = tax,
                TaxDescription = taxDescription,
                DeliveryCost = deliveryCost,
                DeliveryMessage = deliveryMessage,
                Total = total,
                PaymentMessage = paymentMessage,
                Region = region.ToString()
            };
        }
    }
}
