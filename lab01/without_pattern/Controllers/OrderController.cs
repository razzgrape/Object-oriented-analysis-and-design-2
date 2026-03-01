using Microsoft.AspNetCore.Mvc;
using Store.NoPattern;

namespace without_pattern.Controllers
{
    // DTO — то что приходит от React
    public record OrderItemDto(string ProductName, decimal ProductPrice, int Quantity);
    public record CheckoutRequest(List<OrderItemDto> Items, string Region);

    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        // БЕЗ ПАТТЕРНА: OrderService напрямую зависит от всех конкретных классов
        private readonly OrderService _orderService = new();
        private static int _orderIdCounter = 1;

        [HttpPost("checkout")]
        public ActionResult<CheckoutResult> Checkout([FromBody] CheckoutRequest request)
        {
            if (request.Items == null || request.Items.Count == 0)
                return BadRequest("Корзина пуста");

            // Собираем Order из DTO
            var order = new Order
            {
                Id = _orderIdCounter++,
                Items = request.Items.Select((item, i) => new OrderItem
                {
                    Product = new Product { Id = i + 1, Name = item.ProductName, Price = item.ProductPrice },
                    Quantity = item.Quantity
                }).ToList()
            };

            // БЕЗ ПАТТЕРНА: парсим строку в enum и передаём в сервис
            // Сервис сам разбирается какие конкретные классы создавать (3 switch-а внутри)
            if (!Enum.TryParse<StoreRegion>(request.Region, out var region))
                return BadRequest($"Неизвестный регион: {request.Region}");

            var result = _orderService.Checkout(order, region);
            return Ok(result);
        }
    }
}
