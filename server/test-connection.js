const axios = require("axios");

async function testServerConnection() {
  try {
    console.log("Testing server connection...");

    // Test basic server response
    const response = await axios.get("http://localhost:3000/api/schedules", {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Server is running and accessible");
    console.log("Response status:", response.status);
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.error("❌ Server is not running on port 3000");
      console.log("Please start the server with: npm start");
    } else if (error.response) {
      console.log("✅ Server is running (got response)");
      console.log("Response status:", error.response.status);
      if (error.response.status === 401) {
        console.log("ℹ️  Authentication required (this is expected)");
      }
    } else {
      console.error("❌ Connection error:", error.message);
    }
  }
}

testServerConnection();
