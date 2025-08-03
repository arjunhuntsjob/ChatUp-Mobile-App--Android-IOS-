import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import DatabaseHelper from '../OfflineHelper/DatabaseHelper';
import NetworkHelper from '../OfflineHelper/NetworkHelper';
const ChatContext = createContext();
const ENDPOINT = 'https://chat-application-1795.onrender.com';

const ChatProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      await DatabaseHelper.initDB();
      NetworkHelper.init();

      // Add network listener
      NetworkHelper.addListener(isConnected => {
        setIsOnline(isConnected);
        if (isConnected) {
          // When back online, sync chats
          fetchChats();
        }
      });
    };

    initializeApp();
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const userInfoString = await AsyncStorage.getItem('userInfo');

      if (!userInfoString) {
        setLoading(false);
        return;
      }

      const userInfo = JSON.parse(userInfoString);

      // Check network status
      const isConnected = await NetworkHelper.checkConnection();

      if (isConnected) {
        // Online: fetch from server
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

        // Save to local database
        await DatabaseHelper.saveChats(data);

        setLoading(false);
      } else {
        // Offline: load from local database
        console.log('Loading chats from local database (offline mode)');
        const localChats = await DatabaseHelper.getChats();
        setChats(localChats);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);

      // If network request fails, try loading from local database
      try {
        const localChats = await DatabaseHelper.getChats();
        setChats(localChats);
      } catch (localError) {
        console.error('Error loading local chats:', localError);
      }

      setLoading(false);
    }
  }, []);

  // Add Notification
  const addNotification = useCallback(
    newMessage => {
      console.log('addNotification called with:', newMessage);

      // Check if the notification for this chat already exists
      const existingNotification = notification.find(
        notif => notif.chat._id === newMessage.chat._id,
      );

      if (!existingNotification) {
        console.log('Adding new notification');
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
      } else {
        console.log('Notification already exists for this chat');
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

  // Socket Setup
  useEffect(() => {
    if (user) {
      console.log('Setting up global socket connection');
      const newSocket = io(ENDPOINT);
      setSocket(newSocket);

      newSocket.emit('setup', user);

      newSocket.on('connected', () => {
        console.log('Global socket connected');
      });

      // Global message received handler for notifications
      newSocket.on('message received', newMessage => {
        console.log('Global message received:', newMessage);

        // Only create notification if:
        // 1. Message is not from current user
        // 2. User is not currently in that chat
        if (
          newMessage.sender._id !== user._id &&
          (!selectedChat || selectedChat._id !== newMessage.chat._id)
        ) {
          console.log('Creating notification for message');
          addNotification(newMessage);
        }
      });

      return () => {
        console.log('Disconnecting global socket');
        newSocket.disconnect();
      };
    }
  }, [user, selectedChat, addNotification]);

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
        socket,
        isOnline,
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
