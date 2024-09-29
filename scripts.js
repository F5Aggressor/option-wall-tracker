let currentChart = null; // Store the chart instance
let optionsDataCache = {}; // Cache the options data for different expiration dates
let currentPrice = null;

async function getOptionsData() {
    const ticker = document.getElementById('stockTicker').value;
    if (!ticker) {
        alert('Please enter a stock ticker symbol!');
        return;
    }

    const apiKey = 'crpflppr01qsek0flv0gcrpflppr01qsek0flv10'; // Your Finnhub API key

    try {
        // Clear previous chart instance
        if (currentChart) {
            currentChart.destroy();
        }

        // Fetch stock price from Finnhub.io
        const priceResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
        const priceData = await priceResponse.json();

        if (!priceData || typeof priceData.c === 'undefined') {
            throw new Error(`Failed to retrieve current price for ${ticker}`);
        }

        currentPrice = priceData.c;
        console.log("Current Price:", currentPrice);

        // Update the current price box
        document.getElementById('priceValue').innerText = currentPrice.toFixed(2);

        // Update the ticker symbol in the new ticker box
        document.getElementById('tickerSymbol').innerText = ticker.toUpperCase();

        // Fetch options chain from Finnhub.io
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        const optionsData = await optionsResponse.json();

        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            alert("No options data available for this ticker.");
            return;
        }

        // Cache the options data
        optionsDataCache = optionsData.data.reduce((acc, option) => {
            acc[option.expirationDate] = option;
            return acc;
        }, {});

        // Populate the expiration dates dropdown
        const expirationDropdown = document.getElementById('expirationDates');
        expirationDropdown.innerHTML = ''; // Clear previous entries
        optionsData.data.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.expirationDate;
            optionElement.text = option.expirationDate;
            expirationDropdown.appendChild(optionElement);
        });

        // Automatically fetch and update the chart with the first expiration date's data
        updateOptionsData();

        document.getElementById('stockTicker').value = ''; // Clear the input

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

function updateOptionsData() {
    const selectedExpiration = document.getElementById('expirationDates').value;
    const selectedOptionData = optionsDataCache[selectedExpiration];

    if (!selectedOptionData) {
        alert("No data available for this expiration date.");
        return;
    }

    const callOptions = selectedOptionData.options.CALL;
    const putOptions = selectedOptionData.options.PUT;

    // Extract strikes, calls open interest, and puts open interest
    const strikes = callOptions.map(option => option.strike);
    const callsOI = callOptions.map(option => option.openInterest);
    const putsOI = putOptions.map(option => option.openInterest);

    // Calculate total Call and Put interest
    const totalCallInterest = callsOI.reduce((sum, oi) => sum + oi, 0);
    const totalPutInterest = putsOI.reduce((sum, oi) => sum + oi, 0);

    console.log("Total Call Interest:", totalCallInterest);
    console.log("Total Put Interest:", totalPutInterest);

    // Update the total interest box
    document.getElementById('totalCallInterest').innerText = totalCallInterest;
    document.getElementById('totalPutInterest').innerText = totalPutInterest;

    // Update Overall OI
    updateOverallOI(totalCallInterest, totalPutInterest);

    const chartData = {
        strikes,
        callsOI,
        putsOI
    };

    renderChart(chartData, currentPrice);
}

// Function to calculate and update the overall OI
function updateOverallOI(totalCallInterest, totalPutInterest) {
    const overallOI = totalCallInterest - totalPutInterest;
    const oiBox = document.getElementById('overallOIValue');
    
    // Add a "+" sign if the overall OI is positive
    oiBox.textContent = (overallOI > 0 ? '+' : '') + overallOI;
}

function renderChart(data, currentPrice) {
    const ctx = document.getElementById('optionsChart').getContext('2d');

    // Destroy the previous chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.strikes,
            datasets: [
                {
                    label: 'Calls Open Interest',
                    data: data.callsOI,
                    backgroundColor: 'rgba(102, 187, 106, 0.8)', // Green for calls
                    borderColor: 'rgba(76, 175, 80, 1)', // Dark green border for calls
                    borderWidth: 1,
                    categoryPercentage: 0.5,
                    barPercentage: 0.8
                },
                {
                    label: 'Puts Open Interest',
                    data: data.putsOI,
                    backgroundColor: 'rgba(239, 83, 80, 0.8)', // Red for puts
                    borderColor: 'rgba(244, 67, 54, 1)', // Dark red border for puts
                    borderWidth: 1,
                    categoryPercentage: 0.5,
                    barPercentage: 0.8
                }
            ]
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45,
                        color: '#e0e0e0' // Light grey text for x-axis labels
                    },
                    grid: {
                        color: '#555555' // Slightly lighter grid lines
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#e0e0e0' // Light grey text for y-axis labels
                    },
                    grid: {
                        color: '#555555' // Slightly lighter grid lines
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0' // Light grey text for the legend
                    }
                },
                tooltip: {
                    backgroundColor: '#4a4a4a', // Dark tooltip background
                    titleColor: '#f4f4f4', // Light tooltip title
                    bodyColor: '#f4f4f4' // Light tooltip body text
                }
            },
            layout: {
                padding: {
                    right: 50
                }
            }
        }
    });
}

// Adding event listener to handle Enter key submission
document.getElementById('stockTicker').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        getOptionsData();
    }
});
