const apiKey = 'crpflppr01qsek0flv0gcrpflppr01qsek0flv10';
let currentChart = null;

// Calculate Risk
document.getElementById("calculate-risk").addEventListener("click", () => {
  const portfolioSize = parseFloat(document.getElementById("portfolio-size").value);
  const riskAppetite = parseFloat(document.getElementById("risk-appetite").value);

  if (!portfolioSize) {
    alert("Please enter a valid portfolio size.");
    return;
  }

  const riskAmount = portfolioSize * riskAppetite;
  document.getElementById("risk-summary").innerHTML = `
    Risk at ${riskAppetite * 100}%: <strong>$${riskAmount.toFixed(2)}</strong>
  `;
});

// Fetch Stock Price
document.getElementById("fetch-stock-price").addEventListener("click", async () => {
  const ticker = document.getElementById("stock-ticker").value.toUpperCase();
  if (!ticker) {
    alert("Please enter a valid ticker.");
    return;
  }

  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
    const data = await response.json();
    const stockPrice = data.c;

    if (stockPrice) {
      document.getElementById("stock-price").value = stockPrice.toFixed(2);
    } else {
      alert("Invalid ticker or no data available.");
    }
  } catch (error) {
    console.error(error);
    alert("Error fetching stock price.");
  }
});

// Calculate PNL
document.getElementById("calculate-pnl").addEventListener("click", () => {
  const stockPrice = parseFloat(document.getElementById("stock-price").value);
  const stopLoss = parseFloat(document.getElementById("stop-loss").value);
  const riskReward = parseFloat(document.getElementById("risk-reward").value);

  if (!stockPrice || !stopLoss || !riskReward) {
    alert("Please fill out all fields.");
    return;
  }

  const targetPrice = stockPrice + (stockPrice - stopLoss) * riskReward;
  document.getElementById("pnl-summary").innerHTML = `
    Target Price: <strong>$${targetPrice.toFixed(2)}</strong>
  `;
});

// Show Graph and Price Movements
document.getElementById("show-price-movements").addEventListener("click", () => {
  const stockPrice = parseFloat(document.getElementById("stock-price").value);
  const stopLoss = parseFloat(document.getElementById("stop-loss").value);
  const riskReward = parseFloat(document.getElementById("risk-reward").value);

  if (!stockPrice || !stopLoss || !riskReward) {
    alert("Please ensure all fields are correctly filled out.");
    return;
  }

  const targetPrice = stockPrice + (stockPrice - stopLoss) * riskReward;

  // Generate price movements
  const priceMovements = [];
  for (let i = -50; i <= 50; i += 5) {
    priceMovements.push({
      percent: i,
      price: stockPrice * (1 + i / 100),
    });
  }

  // Update the price movements table
  const movementsHTML = priceMovements
    .map((movement) => {
      const style =
        movement.price <= stopLoss
          ? 'color: red;'
          : movement.price >= targetPrice
          ? 'color: green;'
          : '';
      return `<tr style="${style}">
        <td>${movement.percent}%</td>
        <td>$${movement.price.toFixed(2)}</td>
      </tr>`;
    })
    .join('');

  document.getElementById("price-movements").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>% Change</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${movementsHTML}
      </tbody>
    </table>
  `;

  // Generate graph
  const ctx = document.getElementById("stockGraph").getContext("2d");
  if (currentChart) currentChart.destroy();
  currentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: priceMovements.map((m) => `${m.percent}%`),
      datasets: [
        {
          label: "Price Movement",
          data: priceMovements.map((m) => m.price),
          borderColor: "blue",
          fill: false,
        },
        {
          label: "Stop Loss",
          data: Array(priceMovements.length).fill(stopLoss),
          borderColor: "red",
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: "Target Price",
          data: Array(priceMovements.length).fill(targetPrice),
          borderColor: "green",
          borderDash: [5, 5],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Price Change (%)" } },
        y: { title: { display: true, text: "Price (USD)" } },
      },
    },
  });
});




