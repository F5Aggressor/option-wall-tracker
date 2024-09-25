let currentChart = null; // Store the chart instance

async function getOptionsData() {
    const ticker = document.getElementById('stockTicker').value;
    if (!ticker) {
        alert('Please enter a stock ticker symbol!');
        return;
    }

    const apiKey = 'crpflppr01qsek0flv0gcrpflppr01qsek0flv10'; // Your Finnhub API key

    try {
        // Fetch stock price from Finnhub.io
        console.log("Fetching stock price...");
        const priceResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
        const priceData = await priceResponse.json();
        console.log("Stock Price Response:", priceData);
        if (!priceData || !priceData.c) {
            throw new Error("Failed to retrieve stock price data.");
        }
        const currentPrice = priceData.c;
        console.log('Current Price:', currentPrice);

        // Fetch options chain from Finnhub.io
        console.log("Fetching options chain...");
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        const optionsData = await optionsResponse.json();
        console.log("Options Chain Response:", optionsData);

        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            alert("No options data available for this ticker.");
            return; // Stop further processing if no options data
        }

        // Initialize combined data structures for open interest
        const combinedCallsOI = {};
        const combinedPutsOI = {};
        
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

        // Loop through all expiration dates and combine open interest
        optionsData.data.forEach(optionChain => {
            const expirationDate = new Date(optionChain.expirationDate);

            // Only consider options expiring within 6 months
            if (expirationDate <= sixMonthsLater) {
                const callOptions = optionChain.options.CALL;
                const putOptions = optionChain.options.PUT;

                callOptions.forEach(option => {
                    const strike = option.strike;
                    if (!combinedCallsOI[strike]) {
                        combinedCallsOI[strike] = 0;
                    }
                    combinedCallsOI[strike] += option.openInterest; // Sum the open interest for calls
                });

                putOptions.forEach(option => {
                    const strike = option.strike;
                    if (!combinedPutsOI[strike]) {
                        combinedPutsOI[strike] = 0;
                    }
                    combinedPutsOI[strike] += option.openInterest; // Sum the open interest for puts
                });
            }
        });

        // Generate strikes 50 points below and above the current price
        const minStrike = Math.floor((currentPrice - 50) / 5) * 5; // Ensure strikes are multiples of 5
        const maxStrike = Math.ceil((currentPrice + 50) / 5) * 5;
        const strikeRange = [];

        for (let strike = minStrike; strike <= maxStrike; strike += 2.5) {
            strikeRange.push(strike); // Push strikes in 2.5 increments
        }

        console.log(`Strike Range (from ${minStrike} to ${maxStrike}):`, strikeRange);

        // Initialize arrays for strikes, calls open interest, and puts open interest
        const chartCallsOI = strikeRange.map(strike => {
            const index = strike;
            return combinedCallsOI[index] || 0;
        });

        const chartPutsOI = strikeRange.map(strike => {
            const index = strike;
            return combinedPutsOI[index] || 0;
        });

        console.log("Chart Calls Open Interest:", chartCallsOI);
        console.log("Chart Puts Open Interest:", chartPutsOI);

        // Generate chart data
        const chartData = {
            strikes: strikeRange, // Use the full strike range
            callsOI: chartCallsOI, // Calls OI mapped to strike range
            putsOI: chartPutsOI // Puts OI mapped to strike range
        };

        renderChart(chartData, currentPrice);
    } catch (error) {
        console.error('Error fetching data from Finnhub.io:', error);
        alert(`Error: ${error.message}`);
    }
}

function renderChart(data, currentPrice) {
    const ctx = document.getElementById('optionsChart').getContext('2d');

    // Destroy the old chart instance if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Create a new chart instance with thicker bars and combined data
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.strikes, // Strike prices dynamically filtered based on current price
            datasets: [
                {
                    label: 'Calls Open Interest',
                    data: data.callsOI,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)', // Light blue for calls
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    barThickness: 20, // Make bars thicker
                },
                {
                    label: 'Puts Open Interest',
                    data: data.putsOI,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)', // Light red for puts
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    barThickness: 20, // Make bars thicker
                }
            ]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: false, // Show strike prices based on dynamic range
                    barPercentage: 1.0, // Adjust bar width relative to space (1.0 is full width)
                    categoryPercentage: 0.8 // Adjust how bars fit within their category space
                },
                y: {
                    beginAtZero: true // Bars start from 0
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: currentPrice,
                            yMax: currentPrice,
                            borderColor: 'rgba(0, 0, 0, 0.5)',
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: `Current Price: $${currentPrice}`,
                                position: 'end',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                padding: 6
                            }
                
