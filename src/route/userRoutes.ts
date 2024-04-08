import { Router } from "express";
import { updateUserInfo, followUser, getAllUsers, getUserById, getUserFollowers, loginUser, registerUser, getUserProfile, searchUsers, unfollowUser } from "../controller/userController";
import { authGuard } from "../middlewares/authenticate";
import { upload } from "../middlewares/uploads";
import { fileToBase64Middleware } from "../middlewares/fileToBase64Middleware";

const router = Router();

// Authentication Routes
router.post("/login", loginUser);


// User CRUD Routes
router.post("/", upload.single("avatar"), registerUser);
router.get("/", authGuard, getAllUsers);
router.get("/profile", authGuard, getUserProfile);
router.get("/:id", getUserById);
router.put('/:id/edit', authGuard, updateUserInfo);




// Follow/Unfollow Routes
router.post("/:id/follow", authGuard, followUser);
router.post("/:id/unfollow", authGuard, unfollowUser);
router.get("/:id/followers", authGuard, getUserFollowers);





// Search Route
router.get('/search/:query', searchUsers);

export default router;
