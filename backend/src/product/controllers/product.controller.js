// Please don't change the pre-written code
// Import the necessary modules here

import { ErrorHandler } from "../../../utils/errorHandler.js";
import {
  addNewProductRepo,
  deleProductRepo,
  findProductRepo,
  getAllProductsRepo,
  getProductDetailsRepo,
  getTotalCountsOfProduct,
  updateProductRepo,
} from "../model/product.repository.js";
import ProductModel from "../model/product.schema.js";

export const addNewProduct = async (req, res, next) => {
  try {
    const product = await addNewProductRepo({
      ...req.body,
      createdBy: req.user._id,
    });
    if (product) {
      res.status(201).json({ success: true, product });
    } else {
      return next(new ErrorHandler(400, "some error occured!"));
    }
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const getAllProducts = async (req, res, next) => {
  // Implement the functionality for search, filter and pagination this function.
  try {
    //search keyword
    const keyword = req.query.keyword || "";

    //current page
    const page = Number(req.query.page) || 1;

    //produts per page
    const resultPerPage = 5;

    //skip no.of documents calculation
    const skip = (page - 1) * resultPerPage;

    //filter object
    const filter = {};

    //search by product name
    if (keyword) {
      filter.name = {
        $regex: keyword, // pattern to search matching product names
        $options: "i", // makes search case-insensitive
      };
    }

    //total products count
    const totalProducts = await ProductModel.countDocuments(filter); // count no.of documents matching with the filter

    //fetch products
    const products = await ProductModel.find(filter)
      .limit(resultPerPage)
      .skip(skip);

    //total pages
    const totalPages = Math.ceil(totalProducts / resultPerPage);

    res.status(200).send({
      success: true,
      totalProducts,
      totalPages,
      currentPage: page,
      products,
    });
  } catch (error) {
    return next(new ErrorHandler(500, error.message));
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const updatedProduct = await updateProductRepo(req.params.id, req.body);
    if (updatedProduct) {
      res.status(200).json({ success: true, updatedProduct });
    } else {
      return next(new ErrorHandler(400, "Product not found!"));
    }
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const deletedProduct = await deleProductRepo(req.params.id);
    if (deletedProduct) {
      res.status(200).json({ success: true, deletedProduct });
    } else {
      return next(new ErrorHandler(400, "Product not found!"));
    }
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const getProductDetails = async (req, res, next) => {
  try {
    const productDetails = await getProductDetailsRepo(req.params.id);
    if (productDetails) {
      res.status(200).json({ success: true, productDetails });
    } else {
      return next(new ErrorHandler(400, "Product not found!"));
    }
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const rateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;
    const user = req.user._id;
    const name = req.user.name;
    const review = {
      user,
      name,
      rating: Number(rating),
      comment,
    };
    if (!rating) {
      return next(new ErrorHandler(400, "rating can't be empty"));
    }
    const product = await findProductRepo(productId);
    if (!product) {
      return next(new ErrorHandler(400, "Product not found!"));
    }
    const findRevieweIndex = product.reviews.findIndex((rev) => {
      return rev.user.toString() === user.toString();
    });
    if (findRevieweIndex >= 0) {
      product.reviews.splice(findRevieweIndex, 1, review);
    } else {
      product.reviews.push(review);
    }
    let avgRating = 0;
    product.reviews.forEach((rev) => {
      avgRating += rev.rating;
    });
    const updatedRatingOfProduct = avgRating / product.reviews.length;
    product.rating = updatedRatingOfProduct;
    await product.save({ validateBeforeSave: false });
    res
      .status(201)
      .json({ success: true, msg: "thx for rating the product", product });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const getAllReviewsOfAProduct = async (req, res, next) => {
  try {
    const product = await findProductRepo(req.params.id);
    if (!product) {
      return next(new ErrorHandler(400, "Product not found!"));
    }
    res.status(200).json({ success: true, reviews: product.reviews });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const deleteReview = async (req, res, next) => {
  // Insert the essential code into this controller wherever necessary to resolve issues related to removing reviews and updating product ratings.
  try {
    const { productId, reviewId } = req.query;
    if (!productId || !reviewId) {
      return next(
        new ErrorHandler(
          400,
          "pls provide productId and reviewId as query params",
        ),
      );
    }
    const product = await findProductRepo(productId);
    if (!product) {
      return next(new ErrorHandler(404, "Product not found!"));
    }

    const reviewIndex = product.reviews.findIndex((review) => {
      return review._id.toString() === reviewId.toString(); // converting ObjectId to string coz MongoDB ObjectIds cannot be compared directly
    });

    if (reviewIndex === -1) {
      // findIndex() returns -1 when no matching review is found
      return next(new ErrorHandler(400, "review doesn't exist"));
    }

    //if review not belongs to current user
    if (
      product.reviews[reviewIndex].user.toString() !== req.user._id.toString()
    ) {
      return next(new ErrorHandler(403, "You can only delete your own review"));
    }

    //remove review
    product.reviews.splice(reviewIndex, 1);

    // re-calculating the ratings
    if (product.reviews.length === 0) {
      //if not used this if(){} then we get divide by zero error
      product.rating = 0;
    } else {
      const avg =
        product.reviews.reduce((acc, item) => acc + item.rating, 0) /
        product.reviews.length;
      product.rating = avg;
    }

    await product.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
      msg: "review deleted successfully",

      product,
    });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};
