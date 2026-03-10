#include <iostream>
#include <string>
#include <ctime>

class SbpService {
public:
    std::string transferByPhone(const std::string& phone,
                                 long amountKopecks,
                                 const std::string& bankId,
                                 const std::string& message) {
        return "[СБП] Перевод на " + phone + " через банк " + bankId +
               ": " + std::to_string(amountKopecks) + " коп. (" + message + ")";
    }
};

class YooKassaClient {
public:
    std::string createPayment(const std::string& idempotenceKey,
                               int amountKopecks,
                               const std::string& description,
                               const std::string& returnUrl,
                               bool autoCapture) {
        return "[ЮKassa] Платёж " + idempotenceKey +
               ": " + std::to_string(amountKopecks) + " коп. (" + description +
               ") -> " + returnUrl +
               (autoCapture ? " [auto]" : " [manual]");
    }
};

class CryptoGateway {
public:
    std::string sendCrypto(const std::string& walletAddress,
                            double amountBTC,
                            int confirmations,
                            const std::string& network) {
        return "[Crypto] Отправлено " + std::to_string(amountBTC) +
               " BTC на " + walletAddress +
               " (" + network + ", " + std::to_string(confirmations) + " подтв.)";
    }
};

// ============================================================
// ПРОБЛЕМА БЕЗ ПАТТЕРНА:
// PaymentService знает обо ВСЕХ платёжных системах.
// Хранит объекты всех SDK и switch для выбора.
// При добавлении новой системы — менять этот класс.
// Нарушается Open/Closed Principle.
// ============================================================

enum class PaymentMethod {
    SBP,
    YooKassa,
    Crypto
};

class PaymentService {
private:
    SbpService sbp;
    YooKassaClient kassa;
    CryptoGateway crypto;

    std::string sbpPhone = "+79991234567";
    std::string sbpBankId = "100000000111";
    std::string kassaReturnUrl = "https://myshop.ru/thanks";
    std::string cryptoWallet = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
    double btcRate = 10000000.0;

public:
    std::string pay(double amount, const std::string& description, PaymentMethod method) {
        switch (method) {
            case PaymentMethod::SBP: {
                long kopecks = static_cast<long>(amount * 100);
                return sbp.transferByPhone(sbpPhone, kopecks, sbpBankId, description);
            }
            case PaymentMethod::YooKassa: {
                int kopecks = static_cast<int>(amount * 100);
                std::string key = "order_" + std::to_string(time(nullptr));
                return kassa.createPayment(key, kopecks, description, kassaReturnUrl, true);
            }
            case PaymentMethod::Crypto: {
                double btc = amount / btcRate;
                return crypto.sendCrypto(cryptoWallet, btc, 3, "mainnet");
            }
            default:
                return "Ошибка: неизвестный метод оплаты";
        }
    }
};

int main() {
    PaymentService service;

    std::cout << "=== Оплата через СБП ===" << std::endl;
    std::cout << service.pay(5000.0, "Заказ #1", PaymentMethod::SBP) << std::endl;
    std::cout << std::endl;

    std::cout << "=== Оплата через ЮKassa ===" << std::endl;
    std::cout << service.pay(5000.0, "Заказ #2", PaymentMethod::YooKassa) << std::endl;
    std::cout << std::endl;

    std::cout << "=== Оплата криптой ===" << std::endl;
    std::cout << service.pay(5000.0, "Заказ #3", PaymentMethod::Crypto) << std::endl;

    return 0;
}