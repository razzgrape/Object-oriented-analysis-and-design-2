using Store.NoPattern;

// --- Тестовый заказ ---
var product1 = new Product { Id = 1, Name = "Ноутбук", Price = 80000 };
var product2 = new Product { Id = 2, Name = "Мышь", Price = 2000 };

var order = new Order
{
    Id = 42,
    Items = new List<OrderItem>
    {
        new OrderItem { Product = product1, Quantity = 1 },
        new OrderItem { Product = product2, Quantity = 2 },
    }
};

var service = new OrderService();

Console.WriteLine("=== Заказ для России ===");
service.Checkout(order, StoreRegion.Russia);

Console.WriteLine();

Console.WriteLine("=== Заказ для США ===");
service.Checkout(order, StoreRegion.USA);

// Чтобы добавить Германию:
// 1. Добавить GermanyPayment, GermanyDelivery, GermanyTaxCalculator — 3 новых класса
// 2. Добавить StoreRegion.Germany в enum
// 3. Добавить ветку case в КАЖДЫЙ из трёх switch в OrderService
// — при этом трогаем уже рабочий и протестированный код!