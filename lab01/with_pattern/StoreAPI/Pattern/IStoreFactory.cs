namespace StoreAPI.Pattern
{
    public interface IStoreFactory
    {
        IPayment CreatePayment();
        IDelivery CreateDelivery();
        ITaxCalculator CreateTaxCalculator();
    }
}