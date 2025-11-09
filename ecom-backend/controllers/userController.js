import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId).select('-password');

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, email, phone, profile } = req.body;

        const updateData = { name, email, phone };
        if (profile) {
            updateData.profile = profile;
        }

        const user = await userModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

        res.json({ success: true, message: "Profile updated successfully", user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Add new address
const addAddress = async (req, res) => {
    try {
        const { userId, address } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // If this is the first address or marked as default, make it default
        if (user.addresses.length === 0 || address.isDefault) {
            // Remove default from other addresses
            user.addresses.forEach(addr => addr.isDefault = false);
            address.isDefault = true;
        }

        user.addresses.push(address);
        await user.save();

        res.json({ success: true, message: "Address added successfully", addresses: user.addresses });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Update address
const updateAddress = async (req, res) => {
    try {
        const { userId, addressId, address } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.json({ success: false, message: "Address not found" });
        }

        // If making this address default, remove default from others
        if (address.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses[addressIndex] = { ...user.addresses[addressIndex].toObject(), ...address };
        await user.save();

        res.json({ success: true, message: "Address updated successfully", addresses: user.addresses });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Delete address
const deleteAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.json({ success: false, message: "Address not found" });
        }

        const wasDefault = user.addresses[addressIndex].isDefault;
        user.addresses.splice(addressIndex, 1);

        // If deleted address was default, make first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.json({ success: true, message: "Address deleted successfully", addresses: user.addresses });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Set default address
const setDefaultAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Remove default from all addresses
        user.addresses.forEach(addr => addr.isDefault = false);

        // Set new default
        const address = user.addresses.find(addr => addr._id.toString() === addressId);
        if (address) {
            address.isDefault = true;
            await user.save();
            res.json({ success: true, message: "Default address updated", addresses: user.addresses });
        } else {
            res.json({ success: false, message: "Address not found" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Existing functions...
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: 'Invalid credentials' })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()
        const token = createToken(user._id)

        res.json({ success: true, token })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export {
    loginUser,
    registerUser,
    adminLogin,
    getUserProfile,
    updateUserProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
}
