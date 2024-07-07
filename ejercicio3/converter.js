class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
    }

    async getCurrencies() {
        try {
            const response = await fetch(`${this.apiUrl}/currencies`);
            const data = await response.json();
            this.currencies = Object.keys(data).map(code => new Currency(code, data[code]));
        } catch (error) {
            console.error("Error obteniendo las divisas:", error);
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency.code === toCurrency.code) {
            return amount;
        }
        try {
            const response = await fetch(`${this.apiUrl}/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`);
            const data = await response.json();
            return data.rates[toCurrency.code];
        } catch (error) {
            console.error("Error convirtiendo las divisas:", error);
            return null;
        }
    }

    async getHistoricalRate(date, fromCurrency, toCurrency) {
        if (fromCurrency.code === toCurrency.code) {
            return 1;
        }
        try {
            const response = await fetch(`${this.apiUrl}/${date}?from=${fromCurrency.code}&to=${toCurrency.code}`);
            const data = await response.json();
            return data.rates[toCurrency.code];
        } catch (error) {
            console.error(`Error obteniendo el rango de precio en ${date}:`, error);
            return null;
        }
    }

    async compareRates(fromCurrency, toCurrency) {
        const today = this.getCurrentDateFormatted();
        const yesterday = this.getYesterdayDateFormatted();

        const todayRate = await this.getHistoricalRate(today, fromCurrency, toCurrency);
        const yesterdayRate = await this.getHistoricalRate(yesterday, fromCurrency, toCurrency);

        if (todayRate === null || yesterdayRate === null) {
            return null;
        }

        return todayRate - yesterdayRate;
    }

    getCurrentDateFormatted() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getYesterdayDateFormatted() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencySelect.value
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencySelect.value
        );

        const convertedAmount = await converter.convertCurrency(
            amount,
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            resultDiv.textContent = `${amount} ${
                fromCurrency.code
            } son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;

            const rateDifference = await converter.compareRates(fromCurrency, toCurrency);
            if (rateDifference !== null) {
                resultDiv.textContent += `\n - La diferencia en la tasa de cambio entre hoy y ayer es: ${rateDifference.toFixed(4)}`;
            } else {
                resultDiv.textContent += `\n - No se pudo obtener la diferencia en la tasa de cambio.`;
            }
        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
        }
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});