using Microsoft.AspNetCore.Mvc;
using StoreAPI.Pattern;

namespace StoreAPI.Controllers
{
    // DTO — то что приходит от React
    public record OrderItemDto(string ProductName, decimal ProductPrice, int Quantity);
    public record CheckoutRequest(List<OrderItemDto> Items, string Region);

    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
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

            // Выбираем фабрику по региону — единственное место где знаем о конкретных фабриках
            IStoreFactory factory = request.Region switch
            {
                "Russia" => new RussiaFactory(),
                "USA"    => new USFactory(),
                _        => throw new ArgumentException($"Неизвестный регион: {request.Region}")
            };

            var result = _orderService.Checkout(order, factory);
            result.Region = request.Region; // регион знает контроллер, не OrderService
            return Ok(result);
        }
    }
}