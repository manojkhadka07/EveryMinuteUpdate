const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env['MongoDB_KEY'];

async function marketOpenStatus() {
  try {
    const marketStatusAPI = process.env['MarketOpenStatus'];
    const response = await axios.get(marketStatusAPI);
    const data = response.data;
    const isOpen = data.status;

    if (isOpen) {
      console.log("Market is open");
      var chatId = "5053589427";
      fetchData(chatId);
    } else {
      console.log("Market is closed");
      
    }
  } catch (error) {
    console.error("Error fetching market status:", error);
  }
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function insertData(messageId) {
  try {
    const database = client.db("mydatabase");
    const collection = database.collection("deleteMessageId");

    const newData = {
      messageId: messageId
    };

    const result = await collection.insertOne(newData);
    console.log("Data saved successfully. Inserted ID:", result.insertedId);
  } catch (error) {
    console.error("Error saving data:", error);
  }
}


async function readDataDeleteMessage(chatId, bot) {
  try {
    const database = client.db("mydatabase");
    const collection = database.collection("deleteMessageId");

    const query = {}; // Empty query to retrieve all documents

    const result = await collection.find(query).toArray();
    console.log("Data retrieved successfully:");
    console.log(result);

    // Retrieve the message ID from the result
    const messageId = result[0].messageId;

    // Delete the message using the bot.deleteMessage method
    bot.deleteMessage(chatId, messageId)
      .then(() => {
        console.log("Message deleted successfully");

        // Delete the message ID from the MongoDB database
        collection.deleteOne({ messageId: messageId })
          .then((result) => {
            console.log("Message ID deleted from MongoDB successfully:", result.deletedCount);
          })
          .catch((error) => {
            console.error("Error deleting message ID from MongoDB:", error);
          });
      })
      .catch((error) => {
        console.error("Error deleting message:", error);
      });
  } catch (error) {
    console.error("Error reading data:", error);
  }
}




async function fetchData(chatId) {
  try {
    const liveDataAPI = process.env['IndexLiveDataAPI'];
    const response = await axios.get(liveDataAPI);
    const data = response.data;
    const nepseData = data.result.find(item => item.indexName === 'Nepse');
    const telegramBot_TOKEN = process.env['TelegramBot_TOKEN'];
    const bot = new TelegramBot(telegramBot_TOKEN, { polling: false });
    const turnoverValue = amountInFormat(nepseData.turnover);
    const totalVolume = amountInFormat(nepseData.volume);
    const lossGainIcon = currentlyLossGain(nepseData.difference);
    const prediction = await predictStock(); // Await the predictStock function call
    const message = `NEPSE is at ${nepseData.indexValue} with
${lossGainIcon} ${nepseData.difference} [${nepseData.percentChange}%]
Turnover: [${turnoverValue}]
Volume: [${totalVolume}]
Probability: ${prediction}
Previous Close: [${nepseData.previousValue}]
${nepseData.asOfDateString}`;
    bot.sendMessage(chatId, message)
      .then((sentMessage) => {
        console.log("Message ID:", sentMessage.message_id);
        readDataDeleteMessage(chatId, bot);
        insertData(sentMessage.message_id);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  } catch (error) {
    console.error(error);
  }
}

//--------------------------->>
setInterval(() => {
  console.log("Start Machine")
  marketOpenStatus();
}, 60000);

//--------------------------->>

async function predictStock() {
  try {
    // Make a request to the API
    const intraDayHistoryData = process.env['IntraDayHistoryDataAPI'];
    const response = await axios.get(intraDayHistoryData);
    const data = response.data;

    // Check if the data is undefined or empty
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("Error: Could not retrieve stock data.");
      return;
    }

    // Get the closing price of the last trading day
    const lastClosingPrice = data[0].close;

    // Choose a machine learning algorithm
    const windowSize = 10;

    // Train the model
    const movingAvg = [];
    for (let i = 0; i < data.length; i++) {
      const price = parseFloat(data[i].close);
      if (isNaN(price)) {
        continue;
      }
      if (movingAvg.length < windowSize) {
        movingAvg.push(price);
      } else {
        movingAvg.push(price);
        movingAvg.shift();
      }
    }

    // Make predictions
    const lastMovingAvg = movingAvg[movingAvg.length - 1];

    if (lastClosingPrice > lastMovingAvg) {
      // var result = "The stock price of " + scriptName + " is likely to go up.";
      const result = "⬆️";
      return result;
    } else {
      // var result = "The stock price of " + scriptName + " is likely to go down.";
      const result = "⬇️";
      return result;
    }
  } catch (error) {
    console.error(error);
    return "";
  }
}
//--------------------------->>

function currentlyLossGain(differenceRs) {
  const lossgain = differenceRs > 0 ? "🟢 Gain" : differenceRs < 0 ? "🔴 Loss" : "🔵";
  return lossgain;
}
//--------------------------->>

function amountInFormat(num) {
  var num = (Math.round(num).toString());
  if (num.length === 4) {
    var newtext = (num.substring(0, 1));
    var newtext1 = num.slice(1, 4);
    var newtext2 = newtext + "." + newtext1
    var newtext3 = parseFloat(newtext2);
    var newtext4 = newtext3.toFixed(2);
    var formatAmount = (newtext4 + " Hajar");
  }
  if (num.length === 5) {
    var newtext = (num.substring(0, 2));
    var newtext1 = num.slice(2, 5);
    var newtext2 = newtext + "." + newtext1
    var newtext3 = parseFloat(newtext2);
    var newtext4 = newtext3.toFixed(2);
    var formatAmount = (newtext4 + " Hajar"); // ten lac
  }
  if (num.length === 6) {
    var newtext = (num.substring(0, 1));
    var newtext1 = num.slice(1, 4);
    var newtext2 = newtext + "." + newtext1
    var newtext3 = parseFloat(newtext2);
    var newtext4 = newtext3.toFixed(2);
    var formatAmount = (newtext4 + " Lac");
  }
  if (num.length === 7) {
    var newtext = (num.substring(0, 2));
    var newtext1 = num.slice(2, 5);
    var newtext2 = newtext + "." + newtext1
    var newtext3 = parseFloat(newtext2);
    var newtext4 = newtext3.toFixed(2);
    var formatAmount = (newtext4 + " Lac"); // ten lac
  }
  if (num.length === 8) {
    var newtext = (num.substring(0, 1));
    var newtext1 = num.slice(1, 4);
    var newtext2 = newtext + "." + newtext1
    var newtext3 = parseFloat(newtext2);
    var newtext4 = newtext3.toFixed(2);
    var formatAmount = (newtext4 + " Cr");
  }
  if (num.length === 9) {
    var newtext = (num.substring(0, 2));
    var newtext1 = num.slice(2, 5);
    var newtext2 = newtext + "." + newtext1
    var newtext3 = parseFloat(newtext2);
    var newtext4 = newtext3.toFixed(2);
    var formatAmount = (newtext4 + " Cr");
  }
  if (num.length === 10) {
    var newtext = (num.substring(0, 1));
    var newtext1 = num.slice(1, 4);
    var newtext2 = newtext + "." + newtext1
    var newtext3 = parseFloat(newtext2);
    var newtext4 = newtext3.toFixed(2);
    var formatAmount = (newtext4 + " Arb");
  }
  if (num.length === 11) {
    var newtext = (num.substring(0, 2));
    var newtext1 = num.slice(2, 5);
    var newtext2 = newtext + "." + newtext1
    var newtext3 = parseFloat(newtext2);
    var newtext4 = newtext3.toFixed(2);
    var formatAmount = (newtext4 + " Arb");
  }
  return formatAmount;
}

//--------------------------->>
