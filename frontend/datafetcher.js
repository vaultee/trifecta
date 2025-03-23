import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";


dotenv.config(); // Load environment vadcriables

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "N7H3GH5HPWY5HCX5X1USND7RZ2NK1ZHARF"; // Replace with your API key
const walletAddress = "Your Wallet Affress"; // Replace with the actual wallet address

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
module.exports = { fetchWalletTransactions };



// dotenv.config(); // Load environment variables

// // Setup Ethers.js with QuickNode
// const provider = new ethers.JsonRpcProvider("https://fluent-intensive-star.ethereum-sepolia.quiknode.pro/34e0ef3c5f0c0d3376b98fa7ff7f8bdb5a794e6a/");

// async function fetchTransactions() {
//     const block = await provider.getBlock("latest"); // Get latest block
//     console.log("Latest Block Number:", block.number);
//     const txHashes = block.transactions.slice(0, 5); // Fetch only first 5 transactions to avoid rate limit

//     const transactions = await Promise.all(
//         txHashes.map(async (txHash) => {
//             try {
//                 return await provider.getTransaction(txHash);
//             } catch (error) {
//                 console.error("Error fetching transaction:", error);
//                 return null;
//             }
//         })
//     );

//     return transactions.filter(tx => tx !== null); // Remove null responses
// }

// export { fetchTransactions };




