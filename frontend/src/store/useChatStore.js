import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from './useAuthStore';

const useChatStore = create(
  persist(
    (set, get) => ({
      messages: [],
      users: [],
      selectedUser: null,
      isUsersLoading: false,
      isMessagesLoading: false,
      typingUsers: {},

      getUsers: async () => {
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/users");
          set({ users: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Error fetching users");
        } finally {
          set({ isUsersLoading: false });
        }
      },

      getMessages: async (userId) => {
        if (!userId) return;
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Error fetching messages");
        } finally {
          set({ isMessagesLoading: false });
        }
      },

      sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        if (!selectedUser) return toast.error("No chat selected");

        try {
          const res = await axiosInstance.post(`/messages/send`, {
            ...messageData,
            chatId: selectedUser._id,
          });
          set({ messages: [...messages, res.data] });
        } catch (error) {
          toast.error(error.response?.data?.message || "Error sending message");
        }
      },

      subscribeToMessages: () => {
        const { selectedUser } = get();
        const socket = useAuthStore.getState().socket;
        if (!socket || !selectedUser) return;

        socket.on("newMessage", (newMessage) => {
          const isMessageFromCurrentUser = newMessage.senderId === selectedUser._id;
          if (!isMessageFromCurrentUser) return;

          set({
            messages: [...get().messages, newMessage],
          });
        });

        socket.on("userTyping", ({ senderId, isTyping }) => {
          if (!selectedUser || senderId !== selectedUser._id) return;

          set((state) => ({
            typingUsers: {
              ...state.typingUsers,
              [senderId]: isTyping,
            },
          }));
        });
      },

      unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.off("newMessage");
          socket.off("userTyping");
        }
      },

      setSelectedUser: (user) => set({ selectedUser: user }),

      emitTyping: (isTyping) => {
        const socket = useAuthStore.getState().socket;
        const receiverId = get().selectedUser?._id;
        if (!socket || !receiverId) return;
        socket.emit("typing", { receiverId, isTyping });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ selectedUser: state.selectedUser }),
    }
  )
);

export default useChatStore;
