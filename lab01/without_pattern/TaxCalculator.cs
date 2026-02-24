namespace Store.NoPattern
{
    public class RussianTaxCalculator
    {
        public decimal TaxRate { get; set; } = 0.20m; // НДС 20%

        public decimal Calculate(decimal amount)
        {
            return amount * TaxRate;
        }
    }

    public class USTaxCalculator
    {
        public decimal TaxRate { get; set; } = 0.07m; // Sales Tax 7%

        public decimal Calculate(decimal amount)
        {
            return amount * TaxRate;
        }
    }
}