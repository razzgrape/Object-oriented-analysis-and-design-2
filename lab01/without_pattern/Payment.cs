namespace Store.NoPattern
{
    // БЕЗ ПАТТЕРНА: конкретные классы используются напрямую, без интерфейсов

    public class SBPPayment
    {
        public string BankName { get; set; } = "Сбербанк";

        public string Pay(decimal amount)
        {
            return $"Оплата через СБП ({BankName}) на сумму {amount:F2} ₽";
        }
    }

    public class PayPalPayment
    {
        public string Email { get; set; } = "store@example.com";

        public string Pay(decimal amount)
        {
            return $"PayPal payment via {Email}: ${amount:F2}";
        }
    }
}
