namespace Store.NoPattern
{
    // БЕЗ ПАТТЕРНА: конкретные классы используются напрямую, без интерфейсов

    public class SBPPayment
    {
        public string BankName { get; set; } = "Сбербанк";

        public void Pay(decimal amount)
        {
            Console.WriteLine($"[SBP] Оплата через {BankName} на сумму {amount:F2} руб.");
        }
    }

    public class PayPalPayment
    {
        public string Email { get; set; } = "user@example.com";

        public void Pay(decimal amount)
        {
            Console.WriteLine($"[PayPal] Оплата через {Email} на сумму ${amount:F2}");
        }
    }
}