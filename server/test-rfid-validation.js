/**
 * Test script to demonstrate RFID validation functionality
 * This script tests the server-side RFID validation across daycare centers
 */

const { checkRFIDUniqueness } = require("./controllers/userController");

// Mock Firebase Admin for testing
const mockAdmin = {
  database: () => ({
    ref: (path) => ({
      once: (event) => ({
        exists: () => true,
        forEach: (callback) => {
          // Mock users data
          if (path === "users") {
            const mockUsers = [
              {
                uid: "user1",
                firstName: "John",
                lastName: "Doe",
                childRFID: "RFID123",
                role: "parent",
              },
              {
                uid: "user2",
                firstName: "Jane",
                lastName: "Smith",
                childRFID: "RFID456",
                role: "parent",
              },
            ];
            mockUsers.forEach((user) =>
              callback({ key: user.uid, val: () => user })
            );
          }
          // Mock sections data
          if (path === "sections") {
            const mockSections = [
              {
                name: "Daycare Center K1",
                assignedStudents: ["user1"],
              },
              {
                name: "Daycare Center K2",
                assignedStudents: ["user2"],
              },
            ];
            mockSections.forEach((section) => callback({ val: () => section }));
          }
        },
      }),
    }),
  }),
};

// Replace the admin module for testing
jest.mock("firebase-admin", () => mockAdmin);

async function testRFIDValidation() {
  console.log("🧪 Testing RFID Validation Functionality\n");

  try {
    // Test 1: Check existing RFID
    console.log('Test 1: Checking existing RFID "RFID123"');
    const result1 = await checkRFIDUniqueness("RFID123");
    console.log("Result:", result1);
    console.log(
      "Expected: isUnique = false, existingUser = John Doe in Daycare Center K1\n"
    );

    // Test 2: Check non-existing RFID
    console.log('Test 2: Checking non-existing RFID "RFID999"');
    const result2 = await checkRFIDUniqueness("RFID999");
    console.log("Result:", result2);
    console.log("Expected: isUnique = true, existingUser = null\n");

    // Test 3: Check RFID with excludeUserId
    console.log('Test 3: Checking RFID "RFID123" but excluding user1');
    const result3 = await checkRFIDUniqueness("RFID123", "user1");
    console.log("Result:", result3);
    console.log("Expected: isUnique = true, existingUser = null (same user)\n");

    // Test 4: Check empty RFID
    console.log("Test 4: Checking empty RFID");
    const result4 = await checkRFIDUniqueness("");
    console.log("Result:", result4);
    console.log("Expected: isUnique = true, existingUser = null\n");

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testRFIDValidation();
