import express from 'express';
import {
    loginUser,
    registerUser,
    adminLogin,
    getUserProfile,
    updateUserProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from '../controllers/userController.js';
import authUser from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminLogin)

// Profile routes
userRouter.post('/profile', authUser, getUserProfile)
userRouter.post('/profile/update', authUser, updateUserProfile)

// Address routes
userRouter.post('/address/add', authUser, addAddress)
userRouter.post('/address/update', authUser, updateAddress)
userRouter.post('/address/delete', authUser, deleteAddress)
userRouter.post('/address/default', authUser, setDefaultAddress)

export default userRouter;
