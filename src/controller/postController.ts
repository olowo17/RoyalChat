import cloudinary from 'cloudinary';
import { Request, Response } from 'express';
import Comment from '../model/Comment';
import Post, { IPost } from '../model/Post';
import User from '../model/User';
import streamUpload from '../utils/upload'



// Get all posts from database

const getPublicPosts = async (req: Request, res: Response) => {
  const posts = await Post.find({}).sort({
    createdAt: -1,
  }).limit(20);
  if (posts.length > 0) {
    res.json(posts);
  } else {
    res.status(404).json({ message: 'No posts found' });
  }
};


// display likes as array of users 
const getLikes = async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (post) {
    const likes = await User.find({ _id: { $in: post.likes } });
    res.json(likes);
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
}



// Get posts by user id
const getPrivatePosts = async (req: Request, res: Response) => {
  const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });
  if (posts) {
    res.json(posts);
  } else {
    res.status(404);
    throw new Error('Error while getting posts');
  }
};

// Get Request to find a post by id
const getPostById = async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
};



// A Delete Request to delete a post
const deletePost = async (req: Request, res: Response) => {
  const postId: string = req.params.id;
  const userId: string = req?.user?._id;
  const post = await Post.findOne({ _id: postId });
  const postUserId: string | any = post?.user;
  try {
    if (postUserId?.toString() === userId?.toString()) {
      const deletePostById = await Post.findByIdAndDelete(postId);
      const deletePostComments = await Comment.deleteMany({ postID: postId });
      if (post?.image) {
        cloudinary.v2.uploader.destroy(post.image);
      }
      res.status(200).json({ message: 'Post deleted successfully' });
    }
  } catch (err) {
    res.status(500).send({ message: 'Something goes wrong' });
  }
};

// A Request to like a post
const likePost = async (req: Request, res: Response) => {
  try {
    const postById = await Post.findByIdAndUpdate(req.body.id, {
      $addToSet: { likes: [req.user._id] },
    });
    return res.json({ message: 'Post liked successfully', isLiked: true });
  } catch (err) {
    return res.status(400).json({message:"could not find post"});
  }
};

// A Request which can unlike a post
const unlikePost = async (req: Request, res: Response) => {
  try {
    const postById = await Post.findByIdAndUpdate(req.body.id, {
      $pull: { likes: req.user._id },
    });
    return res.json({ message: 'Post unliked successfully', isLiked: false });
  } catch (err) {
    return res.status(400).json({message:err.message});
  }
};


const addPost = async (req: Request, res: Response) => {
  try {
    const post: IPost = new Post({
      user: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
      text: req.body.text,
      createdAt: Date.now(),
      visibility: req.body.visibility,
      isVerified: req.user.isVerified,
    });

    if (req.file) {
      const result: any = await streamUpload(req);
      post.image = result.secure_url;
    }

    const userById: any = await User.findById(req.user._id);
    const newPost = await post.save();
    userById.posts.push(post);

    if (userById) {
      await userById.save(); // Ensure to await the save operation
    }

    res.json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while creating post');
  }
};




export { addPost, getPublicPosts, unlikePost,getLikes, likePost,getPostById, getPrivatePosts, deletePost };
