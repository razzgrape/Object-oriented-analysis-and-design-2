namespace StoreAPI.Pattern
{
    public interface IPayment
    {
        string Pay(decimal amount);
    }

    public interface IDelivery
    {
        string Deliver(Order order);
        decimal GetCost();
    }

    public interface ITaxCalculator
    {
        decimal Calculate(decimal amount);
        string GetDescription(decimal amount);
    }
}