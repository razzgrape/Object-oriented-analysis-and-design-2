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

    public class OrderService
    {
        public decimal Checkout(Order order, StoreRegion region)
        {
            decimal subTotal = order.GetSubTotal();
            decimal tax = 0;
            decimal deliveryCost = 0;

            // Дублирующиеся if/switch — при добавлении новой страны
            // придётся добавлять ветку в КАЖДОМ switch

            // Считаем налог
            switch (region)
            {
                case StoreRegion.Russia:
                    var ruTax = new RussianTaxCalculator();
                    tax = ruTax.Calculate(subTotal);
                    break;

                case StoreRegion.USA:
                    var usTax = new USTaxCalculator();
                    tax = usTax.Calculate(subTotal);
                    break;

                default:
                    throw new NotSupportedException($"Регион {region} не поддерживается");
            }

            // Выбираем доставку и доставляем
            switch (region)
            {
                case StoreRegion.Russia:
                    var ruDelivery = new RussianDelivery();
                    deliveryCost = ruDelivery.Cost;
                    ruDelivery.Deliver(order);
                    break;

                case StoreRegion.USA:
                    var usDelivery = new USDelivery();
                    deliveryCost = usDelivery.Cost;
                    usDelivery.Deliver(order);
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
                    sbp.Pay(total);
                    break;

                case StoreRegion.USA:
                    var paypal = new PayPalPayment();
                    paypal.Pay(total);
                    break;

                default:
                    throw new NotSupportedException($"Регион {region} не поддерживается");
            }

            Console.WriteLine($"Итого: {total:F2} (товары: {subTotal:F2} + налог: {tax:F2} + доставка: {deliveryCost:F2})");

            return total;
        }
    }
}