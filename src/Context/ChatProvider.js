import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatContext = createContext();

const ChatProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState([]);

  // Fetch Chats Method
  const fetchChats = useCallback(async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('userInfo');

      if (!userInfoString) {
        setLoading(false);
        return;
      }

      const userInfo = JSON.parse(userInfoString);

      const response = await fetch(
        'https://chat-application-1795.onrender.com/api/chat',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setLoading(false);
    }
  }, []);

  // Add Notification
  const addNotification = useCallback(
    newMessage => {
      // Check if the notification for this chat already exists
      const existingNotification = notification.find(
        notif => notif.chat._id === newMessage.chat._id,
      );

      if (!existingNotification) {
        // Add new notification with full message object
        setNotification(prevNotifications => [
          {
            _id: newMessage._id, // ensure unique ID
            chat: newMessage.chat,
            sender: newMessage.sender,
            content: newMessage.content,
          },
          ...prevNotifications,
        ]);
      }
    },
    [notification],
  );

  // Remove Notification
  const removeNotification = useCallback(chatId => {
    setNotification(prevNotifications =>
      prevNotifications.filter(notif => notif.chat._id !== chatId),
    );
  }, []);

  // Initial load
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userInfoString = await AsyncStorage.getItem('userInfo');

        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setUser(userInfo);
          fetchChats();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, [fetchChats]);

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        fetchChats,
        notification,
        setNotification,
        addNotification,
        removeNotification,
      }}>
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  const context = useContext(ChatContext);

  if (context === undefined) {
    throw new Error('ChatState must be used within a ChatProvider');
  }

  return context;
};

export default ChatProvider;
