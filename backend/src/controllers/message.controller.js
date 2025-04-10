import User from "../models/userModel.js";
import Message from "../models/message.model.js";
import cloudinary from 'cloudinary'; // Make sure this is configured
import { getRecieverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
      const { text, image, chatId } = req.body;
      const senderId = req.user._id;
      const receiverId = chatId;

      if (!receiverId && !text && !image) {
          return res.status(400).json({ message: "Invalid data" });
      }

      let imageUrl;
      if (image) {
          const uploadResponse = await cloudinary.uploader.upload(image);
          imageUrl = uploadResponse.secure_url;
      }

      const newMessage = new Message({ senderId, receiverId, text, image: imageUrl });
      await newMessage.save();

      const receiverSocketId = getRecieverSocketId(receiverId);
      const senderSocketId = getRecieverSocketId(senderId);

      if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);
      if (senderSocketId) io.to(senderSocketId).emit("newMessage", newMessage);

      res.status(201).json(newMessage);
  } catch (error) {
      res.status(500).json({ message: "Internal server error" });
  }
};

