import { useState, useEffect } from "react";

const API_URL = "http://localhost:8080/api";

const PAYMENT_METHODS = [
  { id: "sbp", name: "СБП", icon: "🏦", desc: "Система быстрых платежей" },
  { id: "yookassa", name: "ЮKassa", icon: "💳", desc: "Онлайн-платежи" },
  { id: "crypto", name: "Crypto", icon: "₿", desc: "Оплата криптовалютой" },
];

export default function App() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [balances, setBalances] = useState({ sbp: 0, yookassa: 0, crypto: 0 });

  useEffect(() => {
    fetch(`${API_URL}/balances`)
      .then((r) => r.json())
      .then((data) => setBalances(data))
      .catch(() => {});
  }, []);

  const handlePay = async () => {
    if (!selectedMethod || !amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError(null);
    setAllResults(null);
    try {
      const response = await fetch(`${API_URL}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod,
          amount: parseFloat(amount),
          description: description || "Без описания",
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setResult(data.message);
      if (data.balances) setBalances(data.balances);
      setHistory((prev) =>
        [
          {
            method: selectedMethod,
            amount: parseFloat(amount),
            timestamp: new Date().toLocaleTimeString("ru-RU"),
          },
          ...prev,
        ].slice(0, 5)
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayAll = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/pay-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description || "Без описания",
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setAllResults(data.messages);
      if (data.balances) setBalances(data.balances);
      setHistory((prev) =>
        [
          {
            method: "all",
            amount: parseFloat(amount),
            timestamp: new Date().toLocaleTimeString("ru-RU"),
          },
          ...prev,
        ].slice(0, 5)
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) =>
    Number(n).toLocaleString("ru-RU", { minimumFractionDigits: 2 });

  const getMethodInfo = (id) => PAYMENT_METHODS.find((m) => m.id === id);

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>◈</span>
            <span style={styles.logoText}>PaymentAdapter</span>
          </div>
          <div style={styles.headerBadge}>Паттерн «Адаптер»</div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.leftCol}>
          {/* Balances */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionNum}>01</span> Балансы счетов
            </h2>
            <div style={styles.balanceGrid}>
              {PAYMENT_METHODS.map((m) => (
                <div key={m.id} style={styles.balanceCard}>
                  <div style={styles.balanceIcon}>{m.icon}</div>
                  <div style={styles.balanceName}>{m.name}</div>
                  <div style={styles.balanceAmount}>
                    {fmt(balances[m.id] || 0)} ₽
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Method Selection */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionNum}>02</span> Способ оплаты
            </h2>
            <div style={styles.methodGrid}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMethod(m.id);
                    setResult(null);
                    setAllResults(null);
                  }}
                  style={{
                    ...styles.methodCard,
                    ...(selectedMethod === m.id ? styles.methodCardActive : {}),
                  }}
                >
                  <div style={styles.methodIcon}>{m.icon}</div>
                  <div style={styles.methodName}>{m.name}</div>
                  <div style={styles.methodDesc}>{m.desc}</div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div style={styles.rightCol}>
          {/* Payment Form */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.sectionNum}>03</span> Оплата
            </h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Сумма (₽)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setResult(null);
                  setAllResults(null);
                }}
                placeholder="Введите сумму"
                style={styles.input}
                min="0"
                step="0.01"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Описание</label>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setResult(null);
                  setAllResults(null);
                }}
                placeholder="Например: Заказ #1"
                style={styles.input}
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div style={styles.buttonsGroup}>
                {selectedMethod && (
                  <button
                    onClick={handlePay}
                    disabled={loading}
                    style={{
                      ...styles.payBtn,
                      ...(loading ? styles.payBtnDisabled : {}),
                    }}
                  >
                    {loading
                      ? "Обработка..."
                      : `Оплатить через ${getMethodInfo(selectedMethod)?.name} →`}
                  </button>
                )}
                <button
                  onClick={handlePayAll}
                  disabled={loading}
                  style={{
                    ...styles.payAllBtn,
                    ...(loading ? styles.payBtnDisabled : {}),
                  }}
                >
                  {loading
                    ? "Обработка..."
                    : `Списать со всех (по ${fmt(parseFloat(amount) / 3)} ₽) →`}
                </button>
              </div>
            )}

            {!amount && (
              <div style={styles.empty}>Введите сумму для оплаты</div>
            )}
          </section>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ Ошибка: {error}
              <div style={styles.errorHint}>
                Убедитесь, что C++ сервер запущен на порту 8080
              </div>
            </div>
          )}

          {/* Single Result */}
          {result && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionNum}>04</span> Результат
              </h2>
              <div style={styles.resultBox}>
                <div style={styles.resultMethod}>
                  {getMethodInfo(selectedMethod)?.icon}{" "}
                  {getMethodInfo(selectedMethod)?.name}
                </div>
                <div style={styles.resultMessage}>{result}</div>
                <div style={styles.patternNote}>
                  💡 Программа вызвала{" "}
                  <strong>processPayment(amount, description)</strong> через
                  единый интерфейс <strong>IPaymentSystem</strong> — адаптер
                  преобразовал вызов в формат конкретного SDK
                </div>
              </div>
            </section>
          )}

          {/* All Results */}
          {allResults && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionNum}>04</span> Результат — все
                системы
              </h2>
              <div style={styles.resultBox}>
                {allResults.map((msg, i) => (
                  <div key={i} style={styles.allResultItem}>
                    <span style={styles.allResultIcon}>
                      {PAYMENT_METHODS[i]?.icon}
                    </span>
                    <div style={styles.resultMessage}>{msg}</div>
                  </div>
                ))}
                <div style={styles.patternNote}>
                  💡 Один цикл по массиву <strong>IPaymentSystem*</strong> —
                  вызвали <strong>processPayment()</strong> у каждого адаптера.
                  Программе всё равно что за SDK внутри
                </div>
              </div>
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionNum}>05</span> История
              </h2>
              <div style={styles.historyList}>
                {history.map((h, i) => (
                  <div key={i} style={styles.historyItem}>
                    <span style={styles.historyIcon}>
                      {h.method === "all"
                        ? "🔄"
                        : getMethodInfo(h.method)?.icon}
                    </span>
                    <span style={styles.historyName}>
                      {h.method === "all"
                        ? "Все системы"
                        : getMethodInfo(h.method)?.name}
                    </span>
                    <span style={styles.historyAmount}>
                      {fmt(h.amount)} ₽
                    </span>
                    <span style={styles.historyTime}>{h.timestamp}</span>
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
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "0.05em",
    color: "#e8e8f0",
  },
  headerBadge: {
    padding: "4px 12px",
    border: "1px solid #2a2a3e",
    borderRadius: 6,
    fontSize: 11,
    color: "#7c6af7",
    letterSpacing: "0.05em",
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
  leftCol: {},
  rightCol: {},
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
  sectionNum: { color: "#333", fontWeight: 400 },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  balanceCard: {
    background: "#111120",
    border: "1px solid #1e1e2e",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  balanceIcon: { fontSize: 28 },
  balanceName: { fontSize: 11, color: "#888" },
  balanceAmount: { fontSize: 16, fontWeight: 700, color: "#a5f3a5" },
  methodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  methodCard: {
    background: "#111120",
    border: "1px solid #1e1e2e",
    borderRadius: 10,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
    color: "#888",
  },
  methodCardActive: {
    border: "1px solid #7c6af7",
    color: "#e8e8f0",
    background: "#1a1a2e",
  },
  methodIcon: { fontSize: 36 },
  methodName: { fontSize: 14, fontWeight: 700 },
  methodDesc: { fontSize: 11, textAlign: "center", opacity: 0.6 },
  formGroup: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 11,
    color: "#555",
    marginBottom: 6,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "#111120",
    border: "1px solid #2a2a3e",
    borderRadius: 8,
    color: "#e8e8f0",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  buttonsGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 20,
  },
  payBtn: {
    width: "100%",
    padding: "12px 0",
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
  payAllBtn: {
    width: "100%",
    padding: "12px 0",
    background: "transparent",
    border: "1px solid #7c6af7",
    borderRadius: 8,
    color: "#7c6af7",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.03em",
  },
  payBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  empty: {
    color: "#444",
    fontSize: 13,
    textAlign: "center",
    padding: "20px 0",
  },
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
    gap: 12,
  },
  resultMethod: {
    fontSize: 14,
    fontWeight: 700,
    color: "#7c6af7",
    letterSpacing: "0.05em",
  },
  resultMessage: {
    fontSize: 12,
    color: "#e8e8f0",
    padding: "10px 14px",
    background: "#111120",
    border: "1px solid #1e1e2e",
    borderRadius: 8,
    lineHeight: 1.6,
    wordBreak: "break-all",
  },
  allResultItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  allResultIcon: { fontSize: 20, flexShrink: 0, paddingTop: 8 },
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
  historyIcon: { fontSize: 18 },
  historyName: { color: "#7c6af7", fontSize: 12, minWidth: 90 },
  historyAmount: { flex: 1, fontWeight: 700, textAlign: "right" },
  historyTime: { color: "#444", fontSize: 11 },
};