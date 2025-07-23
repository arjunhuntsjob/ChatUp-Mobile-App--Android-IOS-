import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
} from 'react-native';
import { ChatState } from '../../Context/ChatProvider';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Modal } from 'react-native';
import { Searchbar } from 'react-native-paper';
import AnimatedSearchOverlay from './AnimatedSearchOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import GroupChatModal from './GroupChatModal';
import NotificationDropdown from './NotificationDropdown';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const HomeScreen = () => {
  // const {selectedChat, setSelectedChat, user, chats, setChats} = ChatState();
  // In your HomeScreen component, make sure this line includes notification:
  const { selectedChat, setSelectedChat, user, chats, setChats, notification } =
    ChatState();

  const [isGroupChatModalOpen, setIsGroupChatModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOverlayVisible, setIsSearchOverlayVisible] = useState(false);
  const [isNotificationDropdownVisible, setIsNotificationDropdownVisible] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };
  const fetchChats = async () => {
    try {
      const response = await fetch(
        'https://chat-application-1795.onrender.com/api/chat',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const data = await response.json();
      console.log('Fetched Chats:', data);

      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats(); // refresh on screen focus
    }, [])
  );


  useEffect(() => {
    fetchChats();
  }, []);

  const handleNotificationPress = notificationItem => {
    if (!notificationItem || !notificationItem.chat) {
      console.error('Invalid notification', notificationItem);
      return;
    }

    setSelectedChat(notificationItem.chat);
    navigation.navigate('Messages', { chat: notificationItem.chat });
  };

  const getSenderName = (loggedUser, users) => {
    return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
  };

  const getSenderPic = (loggedUser, users) => {
    return users[0]._id === loggedUser._id ? users[1].pic : users[0].pic;
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedChat(item);
        navigation.navigate('Messages', { chat: item });
      }}
      style={[
        styles.chatItem,
        selectedChat?._id === item._id ? styles.selectedChatItem : null,
      ]}>
      {!item.isGroupChat ? (
        <Image
          source={{ uri: getSenderPic(user, item.users) }}
          style={[
            styles.avatar,
            selectedChat?._id === item._id
              ? styles.selectedAvatar
              : styles.normalAvatar,
          ]}
        />
      ) : (
        <View
          style={[
            styles.groupAvatar,
            selectedChat?._id === item._id
              ? styles.selectedGroupAvatar
              : styles.normalGroupAvatar,
          ]}>
          <Text
            style={[
              styles.groupInitial,
              selectedChat?._id === item._id
                ? styles.selectedGroupInitial
                : styles.normalGroupInitial,
            ]}>
            {item.chatName[0].toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.chatInfo}>
        <Text
          style={[
            styles.chatName,
            selectedChat?._id === item._id
              ? styles.selectedText
              : styles.normalText,
          ]}
          numberOfLines={1}>
          {!item.isGroupChat ? getSenderName(user, item.users) : item.chatName}
        </Text>
        {item.latestMessage && (
          <Text
            style={[
              styles.latestMessage,
              selectedChat?._id === item._id
                ? styles.selectedLatestMessage
                : styles.normalLatestMessage,
            ]}
            numberOfLines={1}>
            {item.latestMessage.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Chats Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation or create a group
      </Text>
      <TouchableOpacity
        onPress={() => setIsGroupChatModalOpen(true)}
        style={styles.createGroupButton}>
        <Icon name="plus" size={20} color="#EBE8DB" style={styles.plusIcon} />
        <Text style={styles.createGroupText}>Create Group Chat</Text>
      </TouchableOpacity>
    </View>
  );
  const navigation = useNavigation();

  const HandleLogout = () => {
    setChats([]);
    setSelectedChat(null);
    AsyncStorage.clear();
    navigation.navigate('Login');
  };

  const renderSearchBar = () => (
    <View style={styles.searchBarContainer}>
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => setIsSearchOverlayVisible(true)}>
        <Icon
          name="search"
          size={20}
          color="#8A0032"
          style={styles.searchIcon}
        />
        <Text style={styles.searchPlaceholder}>Search and add new friends</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => setIsGroupChatModalOpen(true)}>
        <Icon name="plus" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Chats</Text>
        <View style={styles.headerRight}>
          {/* Notification Button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              notification.length > 0 && styles.iconButtonWithBadge,
            ]}
            onPress={() => setIsNotificationDropdownVisible(true)}>
            <Icon
              name={notification.length > 0 ? 'bell' : 'bell'}
              size={22}
              color="#EBE8DB"
            />
            {notification.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {notification.length > 99 ? '99+' : notification.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            style={styles.profileImageWrapper}>
            <Image source={{ uri: user?.pic }} style={styles.profileImage} />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {showDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                onPress={() => {
                  setShowDropdown(false);
                  navigation.navigate('ProfileScreen');
                }}
                style={styles.dropdownItem}>
                <Icon
                  name="user"
                  size={18}
                  color="#333"
                  style={styles.dropdownIcon}
                />
                <Text style={styles.dropdownText}>View Profile</Text>
              </TouchableOpacity>
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                onPress={HandleLogout}
                style={styles.dropdownItem}>
                <Icon
                  name="log-out"
                  size={18}
                  color="#333"
                  style={styles.dropdownIcon}
                />
                <Text style={styles.dropdownText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {renderSearchBar()}

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.chatList}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* Group Chat Modal */}
      {isGroupChatModalOpen && (
        <GroupChatModal
          visible={isGroupChatModalOpen}
          onClose={() => setIsGroupChatModalOpen(false)}
          fetchChats={fetchChats}
        />
      )}

      <AnimatedSearchOverlay
        isVisible={isSearchOverlayVisible}
        onClose={() => setIsSearchOverlayVisible(false)}
      />
      <NotificationDropdown
        isVisible={isNotificationDropdownVisible}
        onClose={() => setIsNotificationDropdownVisible(false)}
        onNotificationPress={handleNotificationPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D0301',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  iconButton: {
    backgroundColor: '#8A0032',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  profileImageWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#8A0032',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 9999,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#3D0301',
    marginHorizontal: 1,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#3D0301',
    fontSize: 16,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },

  searchBar: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  searchPlaceholder: {
    color: '#8A0032',
    fontSize: 16,
  },
  plusButton: {
    marginLeft: 10,
    backgroundColor: '#D76C82',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatList: {
    padding: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  selectedChatItem: {
    backgroundColor: '#8A0032',
    borderColor: '#8A0032',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
  },
  normalAvatar: {
    borderColor: '#8A0032',
  },
  selectedAvatar: {
    borderColor: '#EBE8DB',
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  normalGroupAvatar: {
    backgroundColor: '#8A0032',
  },
  selectedGroupAvatar: {
    backgroundColor: '#EBE8DB',
  },
  groupInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  normalGroupInitial: {
    color: '#EBE8DB',
  },
  selectedGroupInitial: {
    color: '#8A0032',
  },
  chatInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  chatName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  normalText: {
    color: '#3D0301',
  },
  selectedText: {
    color: '#EBE8DB',
  },
  latestMessage: {
    fontSize: 14,
  },
  normalLatestMessage: {
    color: '#8A0032',
  },
  selectedLatestMessage: {
    color: 'rgba(235, 232, 219, 0.8)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#8A0032',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#3D0301',
    marginBottom: 16,
    textAlign: 'center',
  },
  createGroupButton: {
    backgroundColor: '#8A0032',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  plusIcon: {
    marginRight: 8,
  },
  createGroupText: {
    color: '#EBE8DB',
    fontWeight: '500',
  },
  notificationBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: 'red',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 1,
  },

  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
