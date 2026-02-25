namespace StoreAPI.Pattern
{
    public class RussiaFactory : IStoreFactory
    {
        public IPayment CreatePayment() => new SBPPayment();
        public IDelivery CreateDelivery() => new RussianDelivery();
        public ITaxCalculator CreateTaxCalculator() => new RussianTaxCalculator();
    }

    public class USFactory : IStoreFactory
    {
        public IPayment CreatePayment() => new PayPalPayment();
        public IDelivery CreateDelivery() => new USDelivery();
        public ITaxCalculator CreateTaxCalculator() => new USTaxCalculator();
    }
}