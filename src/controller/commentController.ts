import { NextFunction, Request, RequestHandler, Response } from 'express';
import Comment from '../model/Comment';
import Post from '../model/Post';
import asyncHandler from 'express-async-handler';
import ErrorResponse from '../utils/errorResponse';
import mongoose from 'mongoose';

// GET request to find comments  by post id
const getComments: RequestHandler = async (req: Request, res: Response) => {
  const currentComment = await Comment.find({ postID: req.params.id }).sort({ createdAt: -1 });
  if (currentComment) {
    res.status(200).json(currentComment);
  } else {
    res.status(404).json({ message: 'No Comment found' });
  }
};

// Delete request to delete a comment

const deleteComment = async (req: Request, res: Response) => {
  try {
    const commentId: string = req.params.id;
    const userId: string = req.user._id;
    const comment: any = await Comment.findById(commentId);
    const commentUserId: string | any = comment.user;
    if (commentUserId?.toString() === userId?.toString()) {
      const deleteCommentById = await Comment.findByIdAndDelete(commentId);
      const deleteCommentFromPost = await Post.findByIdAndUpdate(comment.postID, { $pull: { comments: commentId } });

      res.status(200).json({ message: 'Comment deleted successfully' });
    }
  } catch (err) {
    res.status(404).json({ message: 'Something goes wrong' });
  }
};

// update a comment
const editComment = async (req: Request, res: Response) => {
  try {
    const editComment = await Comment.findByIdAndUpdate(req.params.id, { content: req.body.content });
    if (editComment) {
      res.status(200).json({ message: 'Comment edited successfully' });
    }
  } catch (err) {
    res.status(400).json({ message: 'Comment not edited' });
  }
};

const { ObjectId } = mongoose.Types; 

const addComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { avatar, username } = req.user;
  const { content, createdAt, id: postId } = req.body; // Rename id to postId for clarity
  
  // Check if postId is a valid ObjectId
  if (!ObjectId.isValid(postId)) {
   res.status(400).json({message:"post id is invalid"})
  }

  // Find the post by ID
  const post = await Post.findById(postId);
  
  // Check if the post is not found
  if (!post) {
    throw new ErrorResponse("Post not found", 404); // Throw an error if post is not found
  }

  // Create a new comment object
  const newComment = new Comment({
    postID: postId, // Use postId instead of id for consistency
    avatar: avatar,
    username: username,
    content: content,
    user: req.user._id,
    createdAt: createdAt,
  });

  // Add the new comment to the post's comments array
  await Post.findByIdAndUpdate(postId, {
    $push: { comments: newComment },
  });

  // Save the new comment
  const savedComment = await newComment.save();

  // Respond with appropriate messages based on whether the comment was saved successfully
  if (savedComment) {
    res.status(200).json({ message: 'Comment created successfully' });
  } else {
    throw new ErrorResponse("Failed to create comment", 500); // Throw an error if comment saving fails
  }
});


export { getComments, addComment, deleteComment, editComment };

