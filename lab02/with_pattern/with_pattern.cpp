#include "httplib.h"
#include <iostream>
#include <string>
#include <memory>
#include <ctime>
#include <vector>
#include <iomanip>
#include <sstream>

class SbpService {
private:
    double balanceKopecks = 5000000; 
public:
    std::string transferByPhone(const std::string& phone,
                                 long amountKopecks,
                                 const std::string& bankId,
                                 const std::string& message) {
        if (amountKopecks > balanceKopecks) {
            return "[СБП] Недостаточно средств. Баланс: " +
                   std::to_string(static_cast<long>(balanceKopecks)) + " коп.";
        }
        balanceKopecks -= amountKopecks;
        std::cout << "[СБП] Списано " << amountKopecks << " коп. Остаток: "
                  << std::fixed << std::setprecision(0) << balanceKopecks << " коп. ("
                  << std::setprecision(2) << balanceKopecks / 100.0 << " руб.)" << std::endl;
        return "[СБП] Перевод на " + phone + " через банк " + bankId +
               ": " + std::to_string(amountKopecks) + " коп. (" + message + ")";
    }
    double getBalance() const { return balanceKopecks / 100.0; }
};

class YooKassaClient {
private:
    int balanceKopecks = 3000000;
public:
    std::string createPayment(const std::string& idempotenceKey,
                               int amountKopecks,
                               const std::string& description,
                               const std::string& returnUrl,
                               bool autoCapture) {
        if (amountKopecks > balanceKopecks) {
            return "[ЮKassa] Недостаточно средств. Баланс: " +
                   std::to_string(balanceKopecks) + " коп.";
        }
        balanceKopecks -= amountKopecks;
        std::cout << "[ЮKassa] Списано " << amountKopecks << " коп. Остаток: "
                  << balanceKopecks << " коп. ("
                  << std::fixed << std::setprecision(2) << balanceKopecks / 100.0 << " руб.)" << std::endl;
        return "[ЮKassa] Платёж " + idempotenceKey +
               ": " + std::to_string(amountKopecks) + " коп. (" + description +
               ") -> " + returnUrl +
               (autoCapture ? " [auto]" : " [manual]");
    }
    double getBalance() const { return balanceKopecks / 100.0; }
};

class CryptoGateway {
private:
    double balanceBTC = 0.01; 
public:
    std::string sendCrypto(const std::string& walletAddress,
                            double amountBTC,
                            int confirmations,
                            const std::string& network) {
        if (amountBTC > balanceBTC) {
            return "[Crypto] Недостаточно средств. Баланс: " +
                   std::to_string(balanceBTC) + " BTC";
        }
        balanceBTC -= amountBTC;
        std::cout << "[Crypto] Списано " << std::fixed << std::setprecision(6)
                  << amountBTC << " BTC. Остаток: " << balanceBTC << " BTC" << std::endl;
        return "[Crypto] Отправлено " + std::to_string(amountBTC) +
               " BTC на " + walletAddress +
               " (" + network + ", " + std::to_string(confirmations) + " подтв.)";
    }
    double getBalance(double rate) const { return balanceBTC * rate; }
};

class IPaymentSystem {
public:
    virtual std::string processPayment(double amount, const std::string& description) = 0;
    virtual double getBalance() const = 0;
    virtual std::string getName() const = 0;
    virtual ~IPaymentSystem() = default;
};

class SbpAdapter : public IPaymentSystem {
private:
    SbpService sbpService;
    std::string phone = "+79998887776";
    std::string bankId = "100000000111";
public:
    std::string processPayment(double amount, const std::string& description) override {
        long kopecks = static_cast<long>(amount * 100);
        return sbpService.transferByPhone(phone, kopecks, bankId, description);
    }
    double getBalance() const override { return sbpService.getBalance(); }
    std::string getName() const override { return "СБП"; }
};

class YooKassaAdapter : public IPaymentSystem {
private:
    YooKassaClient kassaClient;
    std::string returnUrl = "https://myshop.ru/thanks";
public:
    std::string processPayment(double amount, const std::string& description) override {
        int kopecks = static_cast<int>(amount * 100);
        std::string key = "order_" + std::to_string(time(nullptr));
        return kassaClient.createPayment(key, kopecks, description, returnUrl, true);
    }
    double getBalance() const override { return kassaClient.getBalance(); }
    std::string getName() const override { return "ЮKassa"; }
};

class CryptoAdapter : public IPaymentSystem {
private:
    CryptoGateway cryptoGateway;
    std::string wallet = "bc1qxy2kgdygjrsqtzq2n";
    double btcRate = 10000000.0;
public:
    std::string processPayment(double amount, const std::string& description) override {
        double btc = amount / btcRate;
        return cryptoGateway.sendCrypto(wallet, btc, 3, "mainnet");
    }
    double getBalance() const override { return cryptoGateway.getBalance(10000000.0); }
    std::string getName() const override { return "Crypto"; }
};

std::string getJsonString(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos = json.find(":", pos);
    if (pos == std::string::npos) return "";
    size_t start = json.find("\"", pos + 1);
    if (start == std::string::npos) return "";
    size_t end = json.find("\"", start + 1);
    if (end == std::string::npos) return "";
    return json.substr(start + 1, end - start - 1);
}

double getJsonNumber(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return 0;
    pos = json.find(":", pos);
    if (pos == std::string::npos) return 0;
    pos++;
    while (pos < json.size() && json[pos] == ' ') pos++;
    std::string num;
    while (pos < json.size() && (isdigit(json[pos]) || json[pos] == '.')) {
        num += json[pos++];
    }
    return num.empty() ? 0 : std::stod(num);
}

std::string fmt(double val) {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(2) << val;
    return oss.str();
}

std::string balancesJson(IPaymentSystem* sbp, IPaymentSystem* kassa, IPaymentSystem* crypto) {
    return "{\"sbp\": " + fmt(sbp->getBalance()) +
           ", \"yookassa\": " + fmt(kassa->getBalance()) +
           ", \"crypto\": " + fmt(crypto->getBalance()) + "}";
}

int main() {
    httplib::Server svr;

    auto sbp = std::make_shared<SbpAdapter>();
    auto kassa = std::make_shared<YooKassaAdapter>();
    auto crypto = std::make_shared<CryptoAdapter>();

    std::vector<std::shared_ptr<IPaymentSystem>> allPayments = {sbp, kassa, crypto};

    std::cout << "=== Начальные балансы ===" << std::endl;
    for (auto& p : allPayments) {
        std::cout << p->getName() << ": " << fmt(p->getBalance()) << " руб." << std::endl;
    }
    std::cout << "=========================" << std::endl << std::endl;

    // Оплата одним способом
    svr.Post("/api/pay", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        std::string method = getJsonString(req.body, "method");
        double amount = getJsonNumber(req.body, "amount");
        std::string description = getJsonString(req.body, "description");

        IPaymentSystem* payment = nullptr;
        if (method == "sbp") payment = sbp.get();
        else if (method == "yookassa") payment = kassa.get();
        else if (method == "crypto") payment = crypto.get();
        else {
            res.set_content("{\"error\": \"Unknown method\"}", "application/json");
            return;
        }

        std::string result = payment->processPayment(amount, description);
        std::string json = "{\"message\": \"" + result + "\", \"balances\": " +
                           balancesJson(sbp.get(), kassa.get(), crypto.get()) + "}";
        res.set_content(json, "application/json");
    });
    // Списать с трех способов
    svr.Post("/api/pay-all", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        double amount = getJsonNumber(req.body, "amount");
        std::string description = getJsonString(req.body, "description");
        double share = amount / 3.0;

        std::cout << std::endl << "=== Оплата со всех систем ===" << std::endl;
        std::cout << "Сумма: " << fmt(amount) << " руб., по " << fmt(share) << " руб. с каждой" << std::endl;

        std::string allMessages = "[";
        for (size_t i = 0; i < allPayments.size(); i++) {
            std::string result = allPayments[i]->processPayment(share, description);
            if (i > 0) allMessages += ", ";
            allMessages += "\"" + result + "\"";
        }
        allMessages += "]";

        std::cout << "==============================" << std::endl << std::endl;

        std::string json = "{\"messages\": " + allMessages + ", \"balances\": " +
                           balancesJson(sbp.get(), kassa.get(), crypto.get()) + "}";
        res.set_content(json, "application/json");
    });

    svr.Get("/api/balances", [&](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set_content(balancesJson(sbp.get(), kassa.get(), crypto.get()), "application/json");
    });

    auto corsHandler = [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.set_content("", "text/plain");
    };
    svr.Options("/api/pay", corsHandler);
    svr.Options("/api/pay-all", corsHandler);
    svr.Options("/api/balances", corsHandler);

    std::cout << "Сервер запущен на http://localhost:8080" << std::endl;
    svr.listen("0.0.0.0", 8080);
    return 0;
}