import { useState } from "react";

const API_URL = "http://localhost:5000/api/order/checkout";

const CATALOG = [
  { id: 1, name: "Ноутбук", price: 80000, icon: "💻" },
  { id: 2, name: "Мышь", price: 2000, icon: "🖱️" },
  { id: 3, name: "Клавиатура", price: 5000, icon: "⌨️" },
  { id: 4, name: "Монитор", price: 35000, icon: "🖥️" },
  { id: 5, name: "Наушники", price: 8000, icon: "🎧" },
  { id: 6, name: "Веб-камера", price: 4500, icon: "📷" },
];

export default function App() {
  const [cart, setCart] = useState([]);
  const [region, setRegion] = useState("Russia");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setResult(null);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
    setResult(null);
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
    setResult(null);
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productName: i.name,
            productPrice: i.price,
            quantity: i.quantity,
          })),
          region,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 5));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const currency = region === "Russia" ? "₽" : "$";
  const fmt = (n) => Number(n).toLocaleString(region === "Russia" ? "ru-RU" : "en-US", { minimumFractionDigits: 2 });

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>◈</span>
            <span style={styles.logoText}>AbstractStore</span>
          </div>
          <div style={styles.regionToggle}>
            <span style={styles.regionLabel}>Регион:</span>
            {["Russia", "USA"].map((r) => (
              <button
                key={r}
                onClick={() => { setRegion(r); setResult(null); }}
                style={{
                  ...styles.regionBtn,
                  ...(region === r ? styles.regionBtnActive : {}),
                }}
              >
                {r === "Russia" ? "🇷🇺 Россия" : "🇺🇸 США"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Catalog */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionNum}>01</span> Каталог
          </h2>
          <div style={styles.catalog}>
            {CATALOG.map((p) => {
              const inCart = cart.find((i) => i.id === p.id);
              return (
                <div key={p.id} style={styles.productCard}>
                  <div style={styles.productIcon}>{p.icon}</div>
                  <div style={styles.productName}>{p.name}</div>
                  <div style={styles.productPrice}>
                    {fmt(p.price)} {currency}
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    style={{
                      ...styles.addBtn,
                      ...(inCart ? styles.addBtnActive : {}),
                    }}
                  >
                    {inCart ? `В корзине (${inCart.quantity})` : "+ В корзину"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <div style={styles.rightCol}>
          {/* Cart */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionNum}>02</span> Корзина
              {cart.length > 0 && (
                <span style={styles.badge}>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              )}
            </h2>

            {cart.length === 0 ? (
              <div style={styles.empty}>Корзина пуста — добавьте товары из каталога</div>
            ) : (
              <>
                <div style={styles.cartList}>
                  {cart.map((item) => (
                    <div key={item.id} style={styles.cartItem}>
                      <span style={styles.cartIcon}>{item.icon}</span>
                      <div style={styles.cartInfo}>
                        <div style={styles.cartName}>{item.name}</div>
                        <div style={styles.cartPrice}>{fmt(item.price)} {currency} × {item.quantity}</div>
                      </div>
                      <div style={styles.cartControls}>
                        <button style={styles.qtyBtn} onClick={() => changeQty(item.id, -1)}>−</button>
                        <span style={styles.qtyNum}>{item.quantity}</span>
                        <button style={styles.qtyBtn} onClick={() => changeQty(item.id, 1)}>+</button>
                        <button style={styles.removeBtn} onClick={() => removeFromCart(item.id)}>✕</button>
                      </div>
                      <div style={styles.cartTotal}>{fmt(item.price * item.quantity)} {currency}</div>
                    </div>
                  ))}
                </div>
                <div style={styles.cartFooter}>
                  <div style={styles.cartSum}>
                    Итого товаров: <strong>{fmt(cartTotal)} {currency}</strong>
                  </div>
                  <button
                    onClick={checkout}
                    disabled={loading}
                    style={{ ...styles.checkoutBtn, ...(loading ? styles.checkoutBtnDisabled : {}) }}
                  >
                    {loading ? "Обработка..." : "Оформить заказ →"}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Result */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ Ошибка: {error}
              <div style={styles.errorHint}>Убедитесь, что бэкенд запущен на порту 5000</div>
            </div>
          )}

          {result && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionNum}>03</span> Результат
              </h2>
              <div style={styles.resultBox}>
                <div style={styles.resultFlag}>
                  {result.region === "Russia" ? "🇷🇺 RussiaFactory" : "🇺🇸 USFactory"}
                </div>

                <div style={styles.resultGrid}>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Сумма товаров</span>
                    <span style={styles.resultValue}>{fmt(result.subTotal)} {currency}</span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Налог</span>
                    <span style={styles.resultValue}>{fmt(result.tax)} {currency}</span>
                  </div>
                  <div style={styles.resultRowSub}>
                    <span style={styles.resultSub}>{result.taxDescription}</span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Доставка</span>
                    <span style={styles.resultValue}>{fmt(result.deliveryCost)} {currency}</span>
                  </div>
                  <div style={styles.resultRowSub}>
                    <span style={styles.resultSub}>{result.deliveryMessage}</span>
                  </div>
                  <div style={styles.divider} />
                  <div style={{ ...styles.resultRow, ...styles.resultTotal }}>
                    <span>ИТОГО</span>
                    <span>{fmt(result.total)} {currency}</span>
                  </div>
                </div>

                <div style={styles.paymentBox}>
                  <span style={styles.paymentLabel}>Оплата:</span>
                  <span style={styles.paymentMsg}>{result.paymentMessage}</span>
                </div>

                <div style={styles.patternNote}>
                  💡 <strong>OrderService</strong> не знает о конкретных классах — он получил фабрику и вызвал методы через интерфейсы
                </div>
              </div>
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionNum}>04</span> История
              </h2>
              <div style={styles.historyList}>
                {history.map((h, i) => (
                  <div key={i} style={styles.historyItem}>
                    <span style={styles.historyRegion}>
                      {h.region === "Russia" ? "🇷🇺" : "🇺🇸"}
                    </span>
                    <span style={styles.historyFactory}>
                      {h.region === "Russia" ? "RussiaFactory" : "USFactory"}
                    </span>
                    <span style={styles.historyTotal}>
                      {fmt(h.total)} {h.region === "Russia" ? "₽" : "$"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e8f0",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  },
  header: {
    borderBottom: "1px solid #1e1e2e",
    background: "#0d0d18",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 22, color: "#7c6af7" },
  logoText: { fontSize: 18, fontWeight: 700, letterSpacing: "0.05em", color: "#e8e8f0" },
  regionToggle: { display: "flex", alignItems: "center", gap: 8 },
  regionLabel: { fontSize: 12, color: "#555", marginRight: 4 },
  regionBtn: {
    padding: "6px 14px",
    border: "1px solid #2a2a3e",
    borderRadius: 6,
    background: "transparent",
    color: "#888",
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.2s",
  },
  regionBtnActive: {
    border: "1px solid #7c6af7",
    color: "#e8e8f0",
    background: "#1a1a2e",
  },
  main: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 24px",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: 32,
    alignItems: "start",
  },
  section: {
    background: "#0d0d18",
    border: "1px solid #1e1e2e",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#7c6af7",
    margin: "0 0 20px 0",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  sectionNum: {
    color: "#333",
    fontWeight: 400,
  },
  badge: {
    background: "#7c6af7",
    color: "#fff",
    borderRadius: 99,
    fontSize: 11,
    padding: "2px 8px",
    fontWeight: 700,
  },
  catalog: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
  },
  productCard: {
    background: "#111120",
    border: "1px solid #1e1e2e",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    transition: "border-color 0.2s",
  },
  productIcon: { fontSize: 32 },
  productName: { fontSize: 13, textAlign: "center", color: "#ccc" },
  productPrice: { fontSize: 14, fontWeight: 700, color: "#e8e8f0" },
  addBtn: {
    marginTop: 4,
    width: "100%",
    padding: "7px 0",
    border: "1px solid #2a2a3e",
    borderRadius: 6,
    background: "transparent",
    color: "#888",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  addBtnActive: {
    border: "1px solid #7c6af7",
    color: "#7c6af7",
    background: "#1a1a2e",
  },
  rightCol: {},
  empty: {
    color: "#444",
    fontSize: 13,
    textAlign: "center",
    padding: "20px 0",
  },
  cartList: { display: "flex", flexDirection: "column", gap: 10 },
  cartItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "#111120",
    borderRadius: 8,
    border: "1px solid #1e1e2e",
  },
  cartIcon: { fontSize: 20, flexShrink: 0 },
  cartInfo: { flex: 1, minWidth: 0 },
  cartName: { fontSize: 13, color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cartPrice: { fontSize: 11, color: "#555", marginTop: 2 },
  cartControls: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  qtyBtn: {
    width: 24, height: 24,
    border: "1px solid #2a2a3e",
    borderRadius: 4,
    background: "transparent",
    color: "#888",
    cursor: "pointer",
    fontSize: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  qtyNum: { width: 20, textAlign: "center", fontSize: 13 },
  removeBtn: {
    width: 24, height: 24,
    border: "1px solid #2a2a3e",
    borderRadius: 4,
    background: "transparent",
    color: "#555",
    cursor: "pointer",
    fontSize: 11,
    marginLeft: 2,
  },
  cartTotal: { fontSize: 13, fontWeight: 700, color: "#e8e8f0", flexShrink: 0, minWidth: 80, textAlign: "right" },
  cartFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid #1e1e2e",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartSum: { fontSize: 13, color: "#888" },
  checkoutBtn: {
    padding: "10px 20px",
    background: "#7c6af7",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.03em",
  },
  checkoutBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  errorBox: {
    background: "#1a0a0a",
    border: "1px solid #5a1a1a",
    borderRadius: 10,
    padding: 16,
    fontSize: 13,
    color: "#f87171",
    marginBottom: 20,
  },
  errorHint: { color: "#666", fontSize: 11, marginTop: 6 },
  resultBox: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  resultFlag: {
    fontSize: 14,
    fontWeight: 700,
    color: "#7c6af7",
    letterSpacing: "0.05em",
  },
  resultGrid: { display: "flex", flexDirection: "column", gap: 4 },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    padding: "6px 0",
  },
  resultRowSub: { paddingBottom: 4 },
  resultLabel: { color: "#888" },
  resultValue: { color: "#e8e8f0", fontWeight: 700 },
  resultSub: { fontSize: 11, color: "#555" },
  divider: { height: 1, background: "#1e1e2e", margin: "8px 0" },
  resultTotal: {
    fontSize: 18,
    fontWeight: 700,
    color: "#7c6af7",
  },
  paymentBox: {
    background: "#111120",
    border: "1px solid #1e1e2e",
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 12,
  },
  paymentLabel: { color: "#555", marginRight: 8 },
  paymentMsg: { color: "#a5f3a5" },
  patternNote: {
    fontSize: 11,
    color: "#555",
    background: "#0a0a14",
    border: "1px dashed #2a2a3e",
    borderRadius: 8,
    padding: "10px 12px",
    lineHeight: 1.6,
  },
  historyList: { display: "flex", flexDirection: "column", gap: 8 },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: "#111120",
    borderRadius: 8,
    border: "1px solid #1e1e2e",
    fontSize: 13,
  },
  historyRegion: { fontSize: 18 },
  historyFactory: { flex: 1, color: "#7c6af7", fontSize: 12 },
  historyTotal: { fontWeight: 700 },
};
