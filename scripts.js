async function getOptionsData() {
    // ... your code above ...

    const currentPrice = priceData.c;

    if (!currentPrice) {
        console.error("No current price found for ticker:", ticker);
        alert(`No current price available for ${ticker}`);
        return;
    }

    // Fetch options chain from Finnhub.io
    const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
    const optionsData = await optionsResponse.json(); // Parse JSON data

    if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
        alert(`No options data available for ${ticker}`);
        return;
    }

    const firstOption = optionsData.data[0]; // First expiration date's options
    const callOptions = firstOption.options.CALL;
    const putOptions = firstOption.options.PUT;

    const strikes = callOptions.map(option => option.strike);

    if (strikes.length === 0) {
        console.error("No strikes found for ticker:", ticker);
        alert(`No strike prices available for ${ticker}`);
        return;
    }

    // Continue with the rest of your logic...
}

