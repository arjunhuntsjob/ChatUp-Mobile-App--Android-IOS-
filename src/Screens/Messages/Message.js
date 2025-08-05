import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Animated,
  ToastAndroid,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { ChatState } from '../../Context/ChatProvider';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import EmojiSelector, { Categories } from 'react-native-emoji-selector';
import GroupChatDetailsModal from './GroupChatsDetailsModal';
import DatabaseHelper from '../../OfflineHelper/DatabaseHelper';
import NetworkHelper from '../../OfflineHelper/NetworkHelper';
import notificationManager from '../../Notifications/NotificationManager';

const ENDPOINT = 'https://chat-application-1795.onrender.com';
const { height: screenHeight } = Dimensions.get('window');

const Messages = ({ route }) => {
  const { selectedChat, user, setSelectedChat } = ChatState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingIndicatorTimeoutRef = useRef(null);
  // Get chat info from route params or ChatState
  const chatInfo = route?.params?.chat || selectedChat;
  const [isOnline, setIsOnline] = useState(true); // Add this line
  const [pendingMessages, setPendingMessages] = useState([]); // Add this line

  // Notifications setup 
  useEffect(() => {
    if (chatInfo) {
      setSelectedChat(chatInfo);
      notificationManager.setCurrentChat(chatInfo._id);
      return () => {
        notificationManager.clearCurrentChat();
      };
    }
  }, [chatInfo]);

  useEffect(() => {
    if (chatInfo) {
      setSelectedChat(chatInfo);

      // Initialize network status
      const initNetworkStatus = async () => {
        const isConnected = await NetworkHelper.checkConnection();
        setIsOnline(isConnected);
      };

      initNetworkStatus();
      fetchMessages();
      setupSocket();

      // Add network listener
      const handleNetworkChange = async isConnected => {
        setIsOnline(isConnected);
        if (isConnected) {
          // When back online, try to send pending messages
          await sendPendingMessages();
          // Refresh messages
          fetchMessages();
        }
      };

      NetworkHelper.addListener(handleNetworkChange);

      return () => {
        if (socket) {
          socket.disconnect();
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
        }
        NetworkHelper.removeListener(handleNetworkChange);
      };
    }
  }, [chatInfo]);

  const setupSocket = () => {
    const newSocket = io(ENDPOINT);
    setSocket(newSocket);

    newSocket.emit('setup', user);
    newSocket.on('connected', () => {
      console.log('Connected to socket');
    });

    newSocket.on('typing', typingInfo => {
      if (
        chatInfo &&
        typingInfo.chatId === chatInfo._id &&
        typingInfo.user._id !== user._id
      ) {
        setIsTyping(true);
        setTypingUser(typingInfo.user);

        // Clear any existing timeout
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
        }

        // Set a fallback timeout to hide typing indicator after 5 seconds
        typingIndicatorTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingUser(null);
        }, 5000);
      }
    });

    newSocket.on('stop typing', typingInfo => {
      if (
        chatInfo &&
        typingInfo.chatId === chatInfo._id &&
        typingInfo.user._id !== user._id
      ) {
        setIsTyping(false);
        setTypingUser(null);

        // Clear the fallback timeout
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
        }
      }
    });
    // newSocket.on('message received', async newMessage => {
    //   if (chatInfo && newMessage.chat._id === chatInfo._id) {
    //     setMessages(prevMessages => [...prevMessages, newMessage]);

    //     // Save the received message to local database
    //     await DatabaseHelper.saveMessage(newMessage);

    //     // Auto scroll to bottom when new message received
    //     setTimeout(() => {
    //       flatListRef.current?.scrollToEnd({ animated: true });
    //     }, 100);
    //   }
    // });


    // Notification setup
    newSocket.on('message received', async newMessage => {
      if (chatInfo && newMessage.chat._id === chatInfo._id) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
        await DatabaseHelper.saveMessage(newMessage);

        // Show notification
        await notificationManager.showMessageNotification(
          newMessage,
          newMessage.chat,
          user
        );

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });


    if (chatInfo) {
      newSocket.emit('join chat', chatInfo._id);
    }
  };

  const sendPendingMessages = async () => {
    const pending = await DatabaseHelper.getPendingMessages(chatInfo._id);

    for (const message of pending) {
      try {
        const messageData = {
          content: message.content,
          chatId: chatInfo._id,
        };

        const response = await fetch(
          'https://chat-application-1795.onrender.com/api/message',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify(messageData),
          },
        );

        if (response.ok) {
          const data = await response.json();

          // Remove the temp message from database
          await DatabaseHelper.deleteMessage(message._id);
          // Save the real message
          await DatabaseHelper.saveMessage(data);

          // Update UI - remove from pending and add to messages
          setPendingMessages(prev =>
            prev.filter(msg => msg._id !== message._id),
          );
          setMessages(prevMessages => [...prevMessages, data]);

          if (socket) {
            socket.emit('new message', data);
          }
        }
      } catch (error) {
        console.error('Error sending pending message:', error);
      }
    }
  };

  const fetchMessages = async () => {
    if (!chatInfo) return;

    try {
      setLoading(true);

      // Check network status
      const isConnected = await NetworkHelper.checkConnection();

      if (isConnected) {
        // Online: fetch from server
        const response = await fetch(
          `https://chat-application-1795.onrender.com/api/message/${chatInfo._id}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data);

        // Save to local database
        await DatabaseHelper.saveMessages(chatInfo._id, data);

        // Load any pending messages
        const pending = await DatabaseHelper.getPendingMessages(chatInfo._id);
        setPendingMessages(pending);

        setLoading(false);

        // Auto scroll to bottom after loading messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } else {
        // Offline: load from local database
        console.log('Loading messages from local database (offline mode)');
        const localMessages = await DatabaseHelper.getMessages(chatInfo._id);
        const pending = await DatabaseHelper.getPendingMessages(chatInfo._id);

        setMessages(localMessages);
        setPendingMessages(pending);
        setLoading(false);

        // Auto scroll to bottom after loading messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);

      // If network request fails, try loading from local database
      try {
        const localMessages = await DatabaseHelper.getMessages(chatInfo._id);
        const pending = await DatabaseHelper.getPendingMessages(chatInfo._id);

        setMessages(localMessages);
        setPendingMessages(pending);
      } catch (localError) {
        console.error('Error loading local messages:', localError);
      }

      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatInfo) return;

    // Stop typing indicator immediately when sending
    if (socket) {
      socket.emit('stop typing', {
        chatId: chatInfo._id,
        user: user,
      });
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Generate temporary ID for the message
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Create temporary message object
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      sender: user,
      chat: chatInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSent: false,
    };

    // Add message to UI immediately
    setPendingMessages(prev => [...prev, tempMessage]);

    // Check network status
    const isConnected = await NetworkHelper.checkConnection();

    if (isConnected) {
      try {
        // Online: send to server
        const messageData = {
          content: messageContent,
          chatId: chatInfo._id,
        };

        const response = await fetch(
          'https://chat-application-1795.onrender.com/api/message',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify(messageData),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        // Remove from pending and add to messages
        setPendingMessages(prev => prev.filter(msg => msg._id !== tempId));
        setMessages(prevMessages => [...prevMessages, data]);

        // Save to local database
        await DatabaseHelper.saveMessage(data);

        if (socket) {
          socket.emit('new message', data);
        }

        // Auto scroll to bottom after sending message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('Error sending message:', error);

        // Save as pending message for later sending
        await DatabaseHelper.savePendingMessage(
          tempId,
          chatInfo._id,
          messageContent,
          user,
        );
        Alert.alert("Message will be sent when you're back online");
      }
    } else {
      // Offline: save as pending message
      await DatabaseHelper.savePendingMessage(
        tempId,
        chatInfo._id,
        messageContent,
        user,
      );

      // Auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleTyping = text => {
    setNewMessage(text);

    if (socket && chatInfo) {
      if (text.trim()) {
        socket.emit('typing', {
          chatId: chatInfo._id,
          user: user,
        });
      } else {
        // Stop typing when input is empty
        socket.emit('stop typing', {
          chatId: chatInfo._id,
          user: user,
        });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Only set timeout if there's text
      if (text.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('stop typing', {
            chatId: chatInfo._id,
            user: user,
          });
        }, 3000);
      }
    }
  };

  const handleEmojiSelect = emoji => {
    setNewMessage(prevMessage => prevMessage + emoji);
    // Keep emoji picker open for multiple selections
  };

  const getSenderName = (loggedUser, users) => {
    return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
  };

  const getSenderPic = (loggedUser, users) => {
    return users[0]._id === loggedUser._id ? users[1].pic : users[0].pic;
  };

  const formatMessageTime = timestamp => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.sender._id === user._id;
    const allMessages = [...messages, ...pendingMessages];
    const showAvatar =
      !isMyMessage &&
      (index === allMessages.length - 1 ||
        allMessages[index + 1]?.sender._id !== item.sender._id);

    const isSelected = selectedMessage?._id === item._id;

    // Fix: Check if message is in pendingMessages array instead of isSent property
    const isPending = pendingMessages.some(pending => pending._id === item._id);

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
          isSelected && styles.selectedMessage,
        ]}>
        {!isMyMessage && showAvatar && (
          <Image source={{ uri: item.sender.pic }} style={styles.messageAvatar} />
        )}
        {!isMyMessage && !showAvatar && <View style={styles.avatarSpacer} />}

        <TouchableOpacity
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            isPending && styles.pendingMessageBubble,
          ]}
          activeOpacity={0.9}
          {...(isMyMessage &&
            !isPending && {
            onLongPress: event => showActionMenu(item, event),
            delayLongPress: 500,
          })}>
          {!isMyMessage && chatInfo.isGroupChat && (
            <Text style={styles.senderName}>{item.sender.name}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
              isPending && styles.pendingMessageText,
            ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isPending && <Text style={styles.pendingStatus}>Sending...</Text>}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  const renderTypingIndicator = () => {
    if (!isTyping || !typingUser) return null;

    return (
      <View style={styles.typingContainer}>
        <Image source={{ uri: typingUser.pic }} style={styles.typingAvatar} />
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>{typingUser.name} is typing</Text>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Messages Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start the conversation by sending a message
      </Text>
    </View>
  );

  const handleGoBack = () => {
    navigation.goBack();
    setSelectedChat(null);
  };

  if (!chatInfo) {
    return (
      <View style={styles.fullContainer}>
        <StatusBar backgroundColor="#8A0032" barStyle="light-content" />
        <SafeAreaView style={styles.topSafeAreaOnly} />
        <SafeAreaView style={styles.mainContainer}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No chat selected</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const showActionMenu = (item, event) => {
    const { pageX, pageY } = event.nativeEvent;

    setSelectedMessage(item);
    setMenuPosition({ x: pageX, y: pageY });
    setMenuVisible(true);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideActionMenu = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
      setSelectedMessage(null);
    });
  };

  const handleCopyMessage = async () => {
    if (selectedMessage) {
      try {
        console.log('selected', selectedMessage.content);
        await Clipboard.setString(selectedMessage?.content);
      } catch (error) {
        console.error('Failed to copy message:', error);
      }
    }
    hideActionMenu();
  };

  const handleDeleteMessage = () => {
    hideActionMenu();
    setTimeout(() => {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const isConnected = await NetworkHelper.checkConnection();

                if (isConnected) {
                  // Online: delete from server
                  const response = await fetch(
                    `https://chat-application-1795.onrender.com/api/message/delete/${selectedMessage._id}`,
                    {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                      },
                    },
                  );

                  if (!response.ok) {
                    throw new Error('Failed to delete message');
                  }
                }

                // Always update local state and database
                setMessages(prevMessages =>
                  prevMessages.filter(msg => msg._id !== selectedMessage._id),
                );
                await DatabaseHelper.deleteMessage(selectedMessage._id);
                setSelectedMessage(null);

                if (Platform.OS === 'android') {
                  ToastAndroid.show('Message deleted', ToastAndroid.SHORT);
                }
              } catch (error) {
                console.error('Error deleting message:', error);
                Alert.alert('Error', 'Something went wrong while deleting.');
              }
            },
          },
        ],
      );
    }, 100);
  };
  const getMenuPosition = () => {
    const menuWidth = 160;
    const menuHeight = 100;
    const padding = 20;

    let x = menuPosition.x;
    let y = menuPosition.y;

    if (x + menuWidth > Dimensions.get('window').width - padding) {
      x = Dimensions.get('window').width - menuWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    if (y + menuHeight > Dimensions.get('window').height - padding) {
      y = y - menuHeight - 20;
    }

    return { x, y };
  };
  const ActionMenu = () => {
    if (!menuVisible) return null;

    const position = getMenuPosition();

    return (
      <>
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          onTouchEnd={hideActionMenu}
        />

        <Animated.View
          style={[
            styles.actionMenu,
            {
              left: position.x,
              top: position.y,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyMessage}
            activeOpacity={0.7}>
            <Icon name="copy" size={16} color="#8A0032" />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>

          <View style={styles.actionSeparator} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeleteMessage}
            activeOpacity={0.7}>
            <Icon name="trash-2" size={16} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Unsend</Text>
          </TouchableOpacity>
        </Animated.View>
      </>
    );
  };
  return (
    <View style={styles.fullContainer}>
      <StatusBar backgroundColor="#8A0032" barStyle="light-content" />
      <SafeAreaView style={styles.topSafeAreaOnly} />
      <SafeAreaView style={styles.mainContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : -15}>
          {/* Chat Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => handleGoBack()}
              style={styles.backIconButton}>
              <Icon name="arrow-left" size={24} color="#EBE8DB" />
            </TouchableOpacity>
            {!chatInfo.isGroupChat ? (
              <Image
                source={{ uri: getSenderPic(user, chatInfo.users) }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerGroupAvatar}>
                <Text style={styles.headerGroupInitial}>
                  {chatInfo.chatName[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>
                {!chatInfo.isGroupChat
                  ? getSenderName(user, chatInfo.users)
                  : chatInfo.chatName}
              </Text>
              {chatInfo.isGroupChat && (
                <Text style={styles.headerSubtitle}>
                  {chatInfo.users.length} members
                </Text>
              )}
              {!isOnline && (
                <Text style={styles.offlineIndicator}>● Offline</Text>
              )}
            </View>
            {chatInfo?.isGroupChat && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  if (chatInfo.isGroupChat) {
                    setShowGroupDetails(true);
                  }
                }}>
                <Icon name="more-vertical" size={22} color="#EBE8DB" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            ref={flatListRef}
            data={[...messages, ...pendingMessages]}
            renderItem={renderMessage}
            style={{ flex: 1 }}
            keyExtractor={(item, index) => item._id || index.toString()}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={loading ? null : renderEmptyMessages}
            onContentSizeChange={() => {
              if (messages.length > 0 || pendingMessages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            showsVerticalScrollIndicator={false}
            onLayout={() => {
              if (messages.length > 0 || pendingMessages.length > 0) {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }, 1000);
              }
            }}
          />

          {renderTypingIndicator()}

          {loading && (
            <ActivityIndicator
              style={{
                color: '#8A0032',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <View style={styles.emojiContainer}>
              <View style={styles.emojiHeader}>
                <Text style={styles.emojiHeaderText}>Choose an emoji</Text>
                <TouchableOpacity
                  onPress={() => setShowEmojiPicker(false)}
                  style={styles.emojiCloseButton}>
                  <Icon name="x" size={20} color="#8A0032" />
                </TouchableOpacity>
              </View>
              <EmojiSelector
                onEmojiSelected={handleEmojiSelect}
                showTabs={true}
                showSearchBar={true}
                showSectionTitles={true}
                category={Categories.emotion}
                columns={8}
                placeholder="Search emoji..."
                style={styles.emojiSelector}
              />
            </View>
          )}

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#999999"
              value={newMessage}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
              onFocus={() => {
                setShowEmojiPicker(false);
                // Small delay to ensure proper keyboard handling on Android
                if (Platform.OS === 'android') {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }
              }}
              blurOnSubmit={false}
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={() => {
                sendMessage(), setNewMessage('');
              }}
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled,
              ]}
              disabled={!newMessage.trim()}>
              <Icon name="send" size={20} color="#EBE8DB" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        <ActionMenu />
        {/* Group Chat Details Modal */}
        {chatInfo?.isGroupChat && (
          <GroupChatDetailsModal
            visible={showGroupDetails}
            chat={chatInfo}
            user={user}
            onClose={() => setShowGroupDetails(false)}
            onUpdateChat={updatedChat => {
              if (updatedChat) {
                setSelectedChat(updatedChat);
                // Optionally refresh messages or update chat info
              } else {
                // User left the group, navigate back
                navigation.goBack();
                setSelectedChat(null);
              }
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  pendingMessageBubble: {
    opacity: 0.7,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pendingMessageText: {
    fontStyle: 'italic',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  pendingStatus: {
    fontSize: 10,
    color: '#FFA500',
    fontStyle: 'italic',
  },
  offlineIndicator: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedMessage: {
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    right: 35,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  actionMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 140,
    zIndex: 1001,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8A0032',
    marginLeft: 12,
  },
  actionSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: '#8A0032',
  },
  topSafeAreaOnly: {
    backgroundColor: '#8A0032',
  },
  mainContainer: {
    flex: 1,
    height: 50,
    backgroundColor: 'white',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#8A0032',
    borderBottomWidth: 1,
    borderBottomColor: '#D76C82',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: Platform.OS === 'ios' ? 0 : 60,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(235, 232, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#EBE8DB',
  },
  headerGroupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBE8DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerGroupInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8A0032',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EBE8DB',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(235, 232, 219, 0.8)',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(235, 232, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#EBE8DB',
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#8A0032',
  },
  avatarSpacer: {
    width: 40,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessageBubble: {
    backgroundColor: '#8A0032',
    borderBottomRightRadius: 4,
    marginLeft: 40,
  },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#D76C82',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A0032',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#EBE8DB',
  },
  theirMessageText: {
    color: '#3D0301',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(235, 232, 219, 0.7)',
  },
  theirMessageTime: {
    color: '#8A0032',
  },
  // typingContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginBottom: 12,
  //   marginTop: 8,
  // },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2, // Reduced from 12
    marginTop: 0,
    paddingHorizontal: 16, // Add horizontal padding to match messages
    backgroundColor: '#EBE8DB', // Make sure it has the same background as messages
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#8A0032',
  },
  typingBubble: {
    backgroundColor: '#D76C82',
    padding: 12,
    borderRadius: 166,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#3D0301',
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8A0032',
    marginHorizontal: 1,
  },
  emojiContainer: {
    height: screenHeight * 0.4,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D76C82',
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F8F8',
  },
  emojiHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A0032',
  },
  emojiCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiSelector: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // inputContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'flex-end',
  //   padding: 16,
  //   // paddingBottom: 0,
  //   paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  //   backgroundColor: '#FFFFFF',
  //   borderTopWidth: 1,
  //   borderTopColor: '#D76C82',
  // },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16, // Changed from 20 to 16
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D76C82',
    minHeight: Platform.OS === 'android' ? 60 : 'auto', // Add minimum height for Android
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(138, 0, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiButtonActive: {
    backgroundColor: '#8A0032',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D76C82',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#F8F8F8',
    color: '#3D0301',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8A0032',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#D76C82',
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8A0032',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#3D0301',
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 219, 219, 0.8)',
  },
  loadingText: {
    fontSize: 16,
    color: '#8A0032',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#8A0032',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#8A0032',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#EBE8DB',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Messages;
