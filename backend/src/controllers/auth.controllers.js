import { generateToken } from "../lib/utils.js";
import User from "../models/userModel.js"
import bcrypt from 'bcryptjs'
import cloudinary from '../lib/cloudinary.js'


export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }
        //hash the password
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be atleast 6 characters long" });
        }
        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({
                message: "Email Already exists"
            });
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = User({
            fullName: fullName,
            email: email,
            password: hashedPassword,
            
        })

        if (newUser) {
            //generate jwt token here
            generateToken(newUser._id, res)
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
                createdAt: newUser.createdAt 

            });
        }
        else {
            res.status(400).json({
                message: "Invalid User Data"
            });
        }
    } catch (error) {
        console.log("Error in signup Controller", error.message);
        res.status(500).json({
            message: " invalid Server Error"
        });
    }
}


export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Invalid Credentials"
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid Credentials"
            })
        }
        //generate jwt token here

        generateToken(user._id, res)
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt 
        })
    } catch (error) {
        console.log("Error in login Controller", error.message);
        res.status(500).json({
            message: " invalid Server Error"
        })

    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({
            message: "Logged Out Successfully"
        })
    } catch (error) {
        log("Error in logout Controller", error.message);
        res.status(500).json({
            message: "Invalid Server Error"
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user?._id;  // Ensure userId is available

        if (!profilePic) {
            return res.status(400).json({ message: "Profile Pic is required" });
        }

        // console.log("Received update request for user:", userId);
        // console.log("Uploading image to Cloudinary...");

        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            folder: "profile_pictures",  // Organize uploads
            resource_type: "image"
        });

        // console.log("Cloudinary upload response:", uploadResponse);

        const updateUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        // console.log("User profile updated successfully:", updateUser);

        res.status(200).json(updateUser);
    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const checkAuth = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        res.status(200).json({
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            profilePic: req.user.profilePic,
            createdAt: req.user.createdAt 
        });
    } catch (error) {
        console.log("Error in checkAuth Controller:", error.message);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
