const axios = require('axios');

async function marketOpenStatus() {
  try {
    const marketStatusAPI = process.env['MarketOpenStatus'];
    const response = await axios.get(marketStatusAPI);
    const data = response.data;
    const isOpen = data.status;

    if (isOpen) {
      console.log("Market is open");
    } else {
      console.log("Market is closed");
      var chatId = "5053589427";
      fetchData(chatId);
    }
  } catch (error) {
    console.error("Error fetching market status:", error);
  }
}

marketOpenStatus();


// setInterval(() => {
//   fetchData(chatId);
// }, 30000);