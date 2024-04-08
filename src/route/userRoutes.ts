import { Router } from "express";
import { editUser, followUser, getAllUsers, getUserById, getUserFollowers, loginUser, registerUser, searchUsers, unfollowUser } from "../controller/userController";
import { authGuard } from "../middlewares/authenticate";
import { upload } from "../middlewares/uploads";

const router = Router();

// Authentication Routes
router.post("/login", loginUser);


// User CRUD Routes
router.post("/", upload.single("avatar"), registerUser);
router.get("/", authGuard, getAllUsers);
router.get("/:id", getUserById);
router.put("/:id/edit", authGuard, upload.single("avatar"), editUser);


// Follow/Unfollow Routes
router.get("/:id/follow", authGuard, followUser);
router.get("/:id/unfollow", authGuard, unfollowUser);
router.get("/:id/followers", authGuard, getUserFollowers);


// Search Route
router.get('/search/:query', searchUsers);

export default router;
