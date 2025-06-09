import React, {useState, useEffect, useRef} from 'react';
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
} from 'react-native';
import {ChatState} from '../../Context/ChatProvider';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import io from 'socket.io-client';
import EmojiSelector, {Categories} from 'react-native-emoji-selector';
import GroupChatDetailsModal from './GroupChatsDetailsModal';

const ENDPOINT = 'https://chat-application-1795.onrender.com';
const {height: screenHeight} = Dimensions.get('window');

const Messages = ({route}) => {
  const {selectedChat, user, setSelectedChat} = ChatState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get chat info from route params or ChatState
  const chatInfo = route?.params?.chat || selectedChat;

  useEffect(() => {
    if (chatInfo) {
      setSelectedChat(chatInfo);
      fetchMessages();
      setupSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatInfo]);

  const setupSocket = () => {
    const newSocket = io(ENDPOINT);
    setSocket(newSocket);

    newSocket.emit('setup', user);
    newSocket.on('connected', () => {
      console.log('Connected to socket');
    });

    newSocket.on('typing', typingInfo => {
      if (chatInfo && typingInfo.chatId === chatInfo._id) {
        setIsTyping(true);
        setTypingUser(typingInfo.user);
      }
    });

    newSocket.on('stop typing', typingInfo => {
      if (chatInfo && typingInfo.chatId === chatInfo._id) {
        setIsTyping(false);
        setTypingUser(null);
      }
    });

    newSocket.on('message received', newMessage => {
      if (chatInfo && newMessage.chat._id === chatInfo._id) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
        // Auto scroll to bottom when new message received
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
    });

    if (chatInfo) {
      newSocket.emit('join chat', chatInfo._id);
    }
  };

  const fetchMessages = async () => {
    if (!chatInfo) return;

    try {
      setLoading(true);
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
      setLoading(false);

      // Auto scroll to bottom after loading messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: false});
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatInfo) return;

    try {
      const messageData = {
        content: newMessage.trim(),
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
      setMessages(prevMessages => [...prevMessages, data]);
      setNewMessage('');
      setShowEmojiPicker(false); // Hide emoji picker after sending

      if (socket) {
        socket.emit('new message', data);
        socket.emit('stop typing', {
          chatId: chatInfo._id,
          user: user,
        });
      }

      // Auto scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleTyping = text => {
    setNewMessage(text);

    if (socket && chatInfo) {
      socket.emit('typing', {
        chatId: chatInfo._id,
        user: user,
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop typing', {
          chatId: chatInfo._id,
          user: user,
        });
      }, 3000);
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

  const renderMessage = ({item, index}) => {
    const isMyMessage = item.sender._id === user._id;
    const showAvatar =
      !isMyMessage &&
      (index === messages.length - 1 ||
        messages[index + 1]?.sender._id !== item.sender._id);

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}>
        {!isMyMessage && showAvatar && (
          <Image source={{uri: item.sender.pic}} style={styles.messageAvatar} />
        )}
        {!isMyMessage && !showAvatar && <View style={styles.avatarSpacer} />}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}>
          {!isMyMessage && chatInfo.isGroupChat && (
            <Text style={styles.senderName}>{item.sender.name}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping || !typingUser) return null;

    return (
      <View style={styles.typingContainer}>
        <Image source={{uri: typingUser.pic}} style={styles.typingAvatar} />
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

  return (
    <View style={styles.fullContainer}>
      <StatusBar backgroundColor="#8A0032" barStyle="light-content" />
      <SafeAreaView style={styles.topSafeAreaOnly} />
      <SafeAreaView style={styles.mainContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          {/* Chat Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => handleGoBack()}
              style={styles.backIconButton}>
              <Icon name="arrow-left" size={24} color="#EBE8DB" />
            </TouchableOpacity>
            {!chatInfo.isGroupChat ? (
              <Image
                source={{uri: getSenderPic(user, chatInfo.users)}}
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

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            style={{flex: 1}}
            keyExtractor={(item, index) => item._id || index.toString()}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={loading ? null : renderEmptyMessages}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({animated: true});
              }
            }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderTypingIndicator}
            onLayout={() => {
              if (messages.length > 0) {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({animated: false});
                }, 1000);
              }
            }}
          />

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
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              style={[
                styles.emojiButton,
                showEmojiPicker && styles.emojiButtonActive,
              ]}>
              <Icon
                name="smile"
                size={24}
                color={showEmojiPicker ? '#FFFFFF' : '#8A0032'}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#999999"
              value={newMessage}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
              onFocus={() => setShowEmojiPicker(false)}
            />

            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled,
              ]}
              disabled={!newMessage.trim()}>
              <Icon name="send" size={20} color="#EBE8DB" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: 1},
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
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    // paddingBottom: 0,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D76C82',
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
    shadowOffset: {width: 0, height: 1},
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
