// Please don't change the pre-written code
// Import the necessary modules here

import { createNewOrderRepo } from "../model/order.repository.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";

export const createNewOrder = async (req, res, next) => {
  // Write your code here for placing a new order
  try {
    // logged in user id
    const user = req.user._id;
    req.body.user = user;

    const order = await createNewOrderRepo(req.body);

    res.status(200).send({
      success: true,
      order,
    });
  } catch (error) {
    return next(new ErrorHandler(500, error.message));
  }
};
