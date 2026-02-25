namespace StoreAPI.Pattern
{
    public class PayPalPayment : IPayment
    {
        public string Email { get; set; } = "store@example.com";
        public string Pay(decimal amount) =>
            $"PayPal payment via {Email}: ${amount:F2}";
    }

    public class USDelivery : IDelivery
    {
        public decimal Cost { get; set; } = 20;
        public string Deliver(Order order) =>
            $"Order #{order.Id} shipped via FedEx. Delivery cost: ${Cost}";
        public decimal GetCost() => Cost;
    }

    public class USTaxCalculator : ITaxCalculator
    {
        public decimal TaxRate { get; set; } = 0.07m;
        public decimal Calculate(decimal amount) => amount * TaxRate;
        public string GetDescription(decimal amount) =>
            $"Sales Tax {TaxRate * 100}%: ${Calculate(amount):F2}";
    }
}