// Please don't change the pre-written code
// Import the necessary modules here

import { sendPasswordResetEmail } from "../../../utils/emails/passwordReset.js";
import { sendWelcomeEmail } from "../../../utils/emails/welcomeMail.js";
import { ErrorHandler } from "../../../utils/errorHandler.js";
import { sendToken } from "../../../utils/sendToken.js";
import {
  createNewUserRepo,
  deleteUserRepo,
  findUserForPasswordResetRepo,
  findUserRepo,
  getAllUsersRepo,
  updateUserProfileRepo,
  updateUserRoleAndProfileRepo,
} from "../models/user.repository.js";
import crypto from "crypto";

export const createNewUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const newUser = await createNewUserRepo(req.body);

    // Implement sendWelcomeEmail function to send welcome message
    await sendWelcomeEmail(newUser);

    await sendToken(newUser, res, 200);
  } catch (err) {
    //  handle error for duplicate email
    // return next(new ErrorHandler(400, err));
    return next(err);
  }
};

export const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler(400, "please enter email/password"));
    }
    const user = await findUserRepo({ email }, true);
    if (!user) {
      return next(
        new ErrorHandler(401, "user not found! register yourself now!!"),
      );
    }
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Invalid email or passswor!"));
    }
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const logoutUser = async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({ success: true, msg: "logout successful" });
};

export const forgetPassword = async (req, res, next) => {
  // Implement feature for forget password
  try {
    //get email
    const email = req.body.email;

    //find user exists
    const user = await findUserRepo({
      email,
    });

    //if user not exits
    if (!user) {
      return next(new ErrorHandler(404, "User not found"));
    }

    //generate reset token
    const resetToken = await user.getResetPasswordToken(); // custom mongoose method to generate hashed reset-password token and expiry time
    await user.save({ validateBeforeSave: false }); // skip mongoose validations because we are only updating reset token fields

    const resetPasswordURL = `http://localhost:${process.env.PORT}/api/storefleet/user/password/reset/${resetToken}`;

    //send email
    await sendPasswordResetEmail(user, resetPasswordURL);

    res.status(200).send({
      success: true,
      msg: `Password reset email sent to ${user.email}`,
    });
  } catch (error) {
    return next(new ErrorHandler(500, error.message));
  }
};

export const resetUserPassword = async (req, res, next) => {
  // Implement feature for reset password
  try {
    //hashing incoming token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex"); //convert final hash into readable hexadecimal string

    //find user with valid token
    const user = await findUserForPasswordResetRepo(hashedToken);

    if (!user) {
      return next(new ErrorHandler(400, "Reset token is invalid or expried"));
    }

    const { password, confirmPassword } = req.body;

    //validate passwords
    if (password !== confirmPassword) {
      return next(
        new ErrorHandler(400, "Password and confirm password do not match"),
      );
    }

    //update password
    user.password = password;

    //clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    //save user
    await user.save();

    //login again
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(500, error.message));
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const userDetails = await findUserRepo({ _id: req.user._id });
    res.status(200).json({ success: true, userDetails });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const updatePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  try {
    if (!currentPassword) {
      return next(new ErrorHandler(401, "pls enter current password"));
    }

    const user = await findUserRepo({ _id: req.user._id }, true);
    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return next(new ErrorHandler(401, "Incorrect current password!"));
    }

    if (!newPassword || newPassword !== confirmPassword) {
      return next(
        new ErrorHandler(401, "mismatch new password and confirm password!"),
      );
    }

    user.password = newPassword;
    await user.save();
    await sendToken(user, res, 200);
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const updateUserProfile = async (req, res, next) => {
  const { name, email } = req.body;
  try {
    const updatedUserDetails = await updateUserProfileRepo(req.user._id, {
      name,
      email,
    });
    res.status(201).json({ success: true, updatedUserDetails });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

// admin controllers
export const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await getAllUsersRepo();
    res.status(200).json({ success: true, allUsers });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const getUserDetailsForAdmin = async (req, res, next) => {
  try {
    const userDetails = await findUserRepo({ _id: req.params.id });
    if (!userDetails) {
      return res
        .status(400)
        .json({ success: false, msg: "no user found with provided id" });
    }
    res.status(200).json({ success: true, userDetails });
  } catch (error) {
    return next(new ErrorHandler(500, error));
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserRepo(req.params.id);
    if (!deletedUser) {
      return res
        .status(400)
        .json({ success: false, msg: "no user found with provided id" });
    }

    res
      .status(200)
      .json({ success: true, msg: "user deleted successfully", deletedUser });
  } catch (error) {
    return next(new ErrorHandler(400, error));
  }
};

export const updateUserProfileAndRole = async (req, res, next) => {
  // Write your code here for updating the roles of other users by admin
  try {
    const updatedUser = await updateUserRoleAndProfileRepo(
      req.params.id,
      req.body,
    );

    if (!updatedUser) {
      return next(new ErrorHandler(404, "User not found"));
    }

    res.status(200).send({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    return next(new ErrorHandler(500, error.message));
  }
};
