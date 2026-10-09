import { ErrorHandler } from "../utils/errorHandler.js";

export const errorHandlerMiddleware = (err, req, res, next) => {
  err.message = err.message || "Internal server error";
  err.statusCode = err.statusCode || 500;
  if (err.code === 11000) {
    //11000 is standard MongoDB duplicate-entry error.(means we get duplicate error with errorcode as 11000)
    err.message = "User already exists with this email";
    err.statusCode = 400;
  }
  res.status(err.statusCode).json({ success: false, error: err.message });
};

// handling handleUncaughtError  Rejection
export const handleUncaughtError = () => {
  process.on("uncaughtException", (err) => {
    console.log(`Error: ${err}`);
    console.log("shutting down server bcz of uncaughtException");
  });
};
