process.env.ORT_LOG_LEVEL = "ERROR";
import { ethers } from "ethers";
import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { pipeline } from "@xenova/transformers"; // Import Hugging Face pipeline
// const { fetchWalletTransactions } = './datafetcher';
import axios from "axios";
import { execSync } from 'child_process';  // Importing for system commands



dotenv.config(); // Load API credentials from .env

const client = new TwitterApi(process.env.BEARER_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "N7H3GH5HPWY5HCX5X1USND7RZ2NK1ZHARF"; // Replace with your API key
const walletAddress = "0x39cB4842AB4775c7948bA73a09D0E92138479262"; // Replace with the actual wallet address

async function fetchWalletTransactions() {
    const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

    try {
        const response = await axios.get(url);

        if (response.data.status === "1") {
            const transactions = response.data.result;
            console.log(`Found ${transactions.length} transactions for wallet: ${walletAddress}`);
            
            transactions.forEach(tx => {
                console.log(`Tx Hash: ${tx.hash}`);
                console.log(`From: ${tx.from}`);
                console.log(`To: ${tx.to}`);
                console.log(`Value: ${ethers.formatEther(tx.value)} ETH`);
                console.log(`Gas Price: ${ethers.formatUnits(tx.gasPrice, "gwei")} Gwei`);
                console.log(`Block Number: ${tx.blockNumber}`);
                console.log("---------------------------");
            });

            return transactions; // Return transaction list
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return [];
        }
    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
}

// Fetch and log transactions
// module.exports = { fetchWalletTransactions };

// Fetch user ID dynamically from username
async function fetchTweetsByUsername(username) {
    try {
        // Get the user ID by username (e.g., defipulse)
        const user = await client.v2.userByUsername(username);
        console.log("User ID:", user.data.id); // Log the correct ID

        // Fetch tweets from the user ID
        const tweets = await client.v2.userTimeline(user.data.id, { max_results: 5 });
         // Make sure to return the data array
         return tweets.data || []; // Ensure it's an array
        // return tweets.data;
        
    } catch (error) {
        console.error("Error fetching tweets:", error);
        return [];
    }
}
// Function to get current system user
function getCurrentUser() {
    try {
        const user = execSync('whoami').toString().trim();  // Execute whoami command
        console.log(`Running as: ${user}`);  // Print current user in the console
        return user;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return "unknown";
    }
}

// Function to run the bash script that opens the browser
function openDashboardInBrowser() {
    try {
        execSync('./start_dashboard.sh');  // Run the Bash script
    } catch (error) {
        console.error("Error opening dashboard in browser:", error);
    }
}

async function generateInvestmentSuggestions(walletAddress) {
    const transactions = await fetchWalletTransactions(walletAddress);  // Fetch wallet transactions
     // Get current system user and print
     const currentUser = getCurrentUser();

    
    const tweets = await fetchTweetsByUsername('defipulse'); // Get latest tweets
    if (tweets.length === 0) {
        console.log("No tweets found or an error occurred.");
        return "No tweets found.";
    }
    console.log("Recent Transactions", transactions)
    console.log("Fetched tweets:", tweets);

     // Open the dashboard in the browser after getting user info
     openDashboardInBrowser();
     

    // Ensure tweets is an array and check if it's empty
    if (!Array.isArray(tweets.data) || tweets.data.length === 0) {
        console.log("No tweets found or an error occurred.");
        return "No tweets found.";
    }

    //Build the prompt for the LLM
    // const prompt = `Based on the following tweets, generate investment suggestions for a user with wallet address: ${walletAddress}.
    
    // Tweets:
    // ${tweets.data.map(t => t.text).join("\n")}

    // Provide insights on whether they should invest in ETH, Sepolia, or other tokens.`;
    const prompt = `
    You are a financial investment assistant. Based on the following transactions and tweets, generate **3-5 investment suggestions** for the wallet holder.

    📝 **User's Recent Transactions**:
    ${fetchWalletTransactions}

    📢 **Recent Crypto News & Tweets**:
    ${tweets.data}

    💡 **Investment Recommendations** (Give **3-5 bullet points**):
    1.
    2.
    3.
    4.
    5.
    `;


    try {
        console.log("Calling Hugging Face API...");

        const response = await axios.post(
            "https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-2.7B", 
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // Return the AI-generated suggestions
        return response.data[0].generated_text;
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return "Failed to generate suggestions.";
    }
}

generateInvestmentSuggestions(walletAddress).then(suggestions => {

    console.log("Suggestions for the wallet address:", suggestions);
}).catch(error => {
    console.error("Error:", error);
});

export { generateInvestmentSuggestions };




