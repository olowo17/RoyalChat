// import cloudinary from "cloudinary";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import streamifier from "streamifier";
import User from "../model/User";
// import { fileToBase64Middleware } from "../middlewares/fileToBase64Middleware";
import cloudinary from "../middlewares/cloudinaryConfig";
// import asyncHandler from "middlewares/async";
import asyncHandler from "express-async-handler";

import { generateAccessToken } from "../utils/generateToken";

import sharp from "sharp";

let refreshTokens: Array<object | string> = [];

// Login Route

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("user");
    const accessToken = generateAccessToken(user._id);

    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      accessToken,
      isVerified: user.isVerified,
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error during login:", error);

    // Handle unexpected errors
    return res.status(500).json({ message: error.message });
  }
};

// streamupload

let streamUpload = (req: any) => {
  return new Promise((resolve, reject) => {
    const data: any = sharp(req.file.buffer).webp({ quality: 60 }).toBuffer();

    let stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "avatars",
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(data).pipe(stream);
  });
};

// Register Route
const registerUser = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { username, email, password } = req.body;

  // Check if password length is less than 6 characters
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password length must be at least 6 characters" });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(404).json({ message: "User already exists" });
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const user = new User({
      username,
      email,
      password: hashPassword,
    });
    if (req?.file) {
      const result: any = await streamUpload(req);
      user.avatar = result.secure_url;
    }

    const savedUser = await user.save();
    const accessToken = generateAccessToken(savedUser._id);

    res.json({
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      avatar: savedUser.avatar,
      accessToken,
    });
  }
});



// fetch all users

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  // dont display current user in list
  const users = await User.find({ _id: { $ne: req.user._id } })
    .sort({ createdAt: -1 })
    .select("-password");
  res.json(users);
};

//get user by Id
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("posts");

    if (user) {
      res.json(user);
    }
  } catch (err) {
    res.status(404).json({ message: "User not found" });
  }
};


// follow user

const followUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    // Check if user is trying to follow themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot follow yourself" });
    }

    // Update the user being followed (add follower)
    const followerUserUpdate = await User.findOneAndUpdate(
      { _id: req.params.id },
      { $addToSet: { followers: req.user._id } },
      { new: true }
    );

    // Update the authenticated user (add following)
    const followingUpdate = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $addToSet: { following: req.params.id } }, // Add the ID of the user being followed
      { new: true }
    );

    // Respond with updated user objects
    return res.status(200).json({
      message: "User followed successfully",
      following: followingUpdate,
    });
  } catch (err) {

    return res
      .status(404)
      .json({ message: "Bad Request" });
  }
};



// unfollow a user


const unfollowUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Remove the authenticated user's ID from the followers array of the user being unfollowed
  const unfollowingUser = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { followers: req.user._id } },
    { new: true }
  );

  // Remove the user being unfollowed from the following array of the authenticated user
  const unfollowedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { following: req.params.id } },
    { new: true }
  );

  // Respond with success message and updated user objects
  res.status(200).json({
    message: "User unfollowed successfully",
    unfollowingUser,
    unfollowedUser,
  });
});





//get user followers

const getUserFollowers = async (req: Request, res: Response) => {
  try {
    const followed: any = await User.findById(req.params.id);
    const followersArr = await User.find({
      _id: { $in: followed.followers },
    })
      .select("-password")
      .limit(10);

    if (followersArr) {
      res.json({ data: followersArr, message: "Data found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error while trying to get followers" });
  }
};

// search users

const searchUsers = async (req: Request, res: Response) => {
  try {
    const userVal = new RegExp(req.params.query, "i");
    const usersArr = await User.find({ username: { $regex: userVal } });
    res.status(200).json(usersArr);
  } catch (err) {
    res.status(404).json({ message: "No user found" });
  }
};

// Update user information


const updateUserInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    
    if (!user) {
    return res.status(404).json({ message: "User not found" });
    }

    const { username, password } = req.body;

    let avatarUrl;
    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path);
      avatarUrl = result.secure_url;
      console.log(avatarUrl);
    }

    const updatedFields: any = {};
    if (username) updatedFields.username = username;
    if (password) updatedFields.password = password;
    if (avatarUrl) updatedFields.avatar = avatarUrl;

    const editedUser = await User.findByIdAndUpdate(
      userId,
      updatedFields,
      { new: true }
    );

    if (!editedUser) {
     return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(editedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error while updating user" });
  }
});





// Get current logged in user

const getUserProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

export {
  followUser, getAllUsers,
  getUserById,
  getUserFollowers, getUserProfile, loginUser,
  registerUser, searchUsers,
  unfollowUser, updateUserInfo
};

