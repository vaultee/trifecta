import { execSync } from 'child_process';  // Import the child_process module to run system commands

// Function to get current system user
function getCurrentUser() {
    try {
        const user = execSync('whoami').toString().trim();  // Run 'whoami' command and get the output
        console.log(`Running as: ${user}`);  // Display current user in console
        return user;  // Return the username
    } catch (error) {
        console.error("Error fetching current user:", error);
        return "unknown";  // Return "unknown" if the command fails
    }
}

// Example usage: Print the current user
const currentUser = getCurrentUser();

