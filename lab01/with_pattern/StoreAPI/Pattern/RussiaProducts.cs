namespace StoreAPI.Pattern
{
    public class SBPPayment : IPayment
    {
        public string BankName { get; set; } = "Сбербанк";
        public string Pay(decimal amount) =>
            $"Оплата через СБП ({BankName}) на сумму {amount:F2} ₽";
    }

    public class RussianDelivery : IDelivery
    {
        public decimal Cost { get; set; } = 300;
        public string Deliver(Order order) =>
            $"Заказ #{order.Id} передан в СДЭК. Стоимость доставки: {Cost} ₽";
        public decimal GetCost() => Cost;
    }

    public class RussianTaxCalculator : ITaxCalculator
    {
        public decimal TaxRate { get; set; } = 0.20m;
        public decimal Calculate(decimal amount) => amount * TaxRate;
        public string GetDescription(decimal amount) =>
            $"НДС {TaxRate * 100}%: {Calculate(amount):F2} ₽";
    }
}