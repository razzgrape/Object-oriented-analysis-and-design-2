namespace StoreAPI.Pattern
{
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
        public CheckoutResult Checkout(Order order, IStoreFactory factory)
        {
            decimal subTotal = order.GetSubTotal();

            var taxCalculator = factory.CreateTaxCalculator();
            decimal tax = taxCalculator.Calculate(subTotal);

            var delivery = factory.CreateDelivery();
            string deliveryMessage = delivery.Deliver(order);
            decimal deliveryCost = delivery.GetCost();

            decimal total = subTotal + tax + deliveryCost;

            var payment = factory.CreatePayment();
            string paymentMessage = payment.Pay(total);

            return new CheckoutResult
            {
                SubTotal = subTotal,
                Tax = tax,
                TaxDescription = taxCalculator.GetDescription(subTotal),
                DeliveryCost = deliveryCost,
                DeliveryMessage = deliveryMessage,
                Total = total,
                PaymentMessage = paymentMessage
            };
        }
    }
}