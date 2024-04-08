import cloudinary from "cloudinary";
import { NextFunction, Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import streamifier from "streamifier";
import Comment from "../model/Comment";
import Post from "../model/Post";
import User from "../model/User";
import bcrypt from "bcrypt";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken";

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
const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
      const refreshToken = generateAccessToken(savedUser._id);

      res.json({
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        avatar: savedUser.avatar,
        accessToken,
      });
    }
  } catch (error) {
    if (error.name === "ValidationError") {
      // Mongoose validation error occurred
      const errorMessage = Object.values(error.errors)
        .map((err: any) => err.message)
        .join("; ");
      return res.status(400).json({ message: errorMessage });
    } else {
      // Other types of errors
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};

// fetch all users

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  // dont display current user in list
  const users = await User.find({ _id: { $ne: req.user._id } })
    .sort({ createdAt: -1 })
    .select("-password");
  res.json(users);
};

// Refresh Auth
const refreshAuth = async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.body.token;
  if (!refreshToken) {
    return res.status(401).json("you are not authenticated");
  }
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid");
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN as Secret, (id: any) => {
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    const newAccessToken = generateAccessToken(id);
    const newRefreshToken = generateRefreshToken(id);

    refreshTokens.push(newRefreshToken);
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
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
    if (req.params.id === req.user._id) {
      res.status(404).json({ message: "You cannot follow yourself" });
    } else {
      // update the follower and  the user following
      let followUser = await User.findOneAndUpdate(
        { _id: req.params.id },
        { $addToSet: { followers: req.user._id } }
      );
      let user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $addToSet: { following: req.params.id } }
      );
    }
    return res.status(200).send({ message: "User followed successfully" });
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Error while tried to follow a user" });
  }
};

// unfollow a user
const unfollowUser = async (req: Request, res: Response) => {
  try {
    let unfollowingUser = await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user._id },
    });
    return res.status(200).send({ message: "User unfollowed successfully" });
  } catch (err) {
    return res.status(500).send({ message: "User UnFollow Failed" });
  }
};

//get user followers

const getUserFollowers = async (req: Request, res: Response) => {
  try {
    const currentUser: any = await User.findById(req.params.id);
    const followersArr = await User.find({
      _id: { $in: currentUser.followers },
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

//edit user
const editUser = async (req: Request, res: Response) => {
  try {
    let { username, email, avatar } = req.body;
    if (req?.file) {
      const result: any = await streamUpload(req);
      avatar = result.secure_url;
    }

    // update user info
    const editedUser: any = await User.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          username: username,
          email: email,
          avatar: avatar,
        },
      },
      { new: true }
    );
    // update all posts of user
    const posts = await Post.find({ user: req.params.id });
    for (let i = 0; i < posts.length; i++) {
      await Post.findByIdAndUpdate(posts[i]._id, {
        $set: {
          avatar: avatar,
          username: username,
        },
      });
    }

    // update all comments of user
    const comments = await Comment.find({ user: req.params.id });
    for (let i = 0; i < comments.length; i++) {
      await Comment.findByIdAndUpdate(comments[i]._id, {
        $set: {
          avatar: avatar,
          username: username,
        },
      });
    }
    res.status(200).json(editedUser);
  } catch (err) {
    res.status(500).json({ message: "Error while trying to edit user" });
  }
};

export {
  loginUser,
  registerUser,
  getAllUsers,
  getUserById,
  getUserFollowers,
  followUser,
  searchUsers,
  editUser,
  unfollowUser,
};
