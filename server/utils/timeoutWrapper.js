/**
 * Timeout wrapper for database operations
 * Prevents operations from hanging indefinitely
 */

const timeoutWrapper = (operation, timeoutMs = 10000) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
};

/**
 * Wrapper for Firebase database operations with timeout
 */
const withTimeout = (dbOperation, timeoutMs = 10000) => {
  return timeoutWrapper(dbOperation, timeoutMs);
};

/**
 * Safe database query with error handling and timeout
 */
const safeDbQuery = async (queryFn, timeoutMs = 10000) => {
  try {
    const result = await withTimeout(queryFn(), timeoutMs);
    return { success: true, data: result };
  } catch (error) {
    console.error("Database query failed:", error);
    return {
      success: false,
      error: error.message.includes("timed out")
        ? "Database operation timed out"
        : "Database query failed",
    };
  }
};

module.exports = {
  timeoutWrapper,
  withTimeout,
  safeDbQuery,
};
