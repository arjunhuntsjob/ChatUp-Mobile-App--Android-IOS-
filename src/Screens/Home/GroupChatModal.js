import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { ChatState } from '../../Context/ChatProvider';

const { width } = Dimensions.get('window');

const GroupChatModal = ({ visible, onClose, fetchChats }) => {
  const [groupChatName, setGroupChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, chats, setChats, setSelectedChat } = ChatState();

  const handleSearch = async query => {
    setSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://chat-application-1795.onrender.com/api/user?search=${query}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const data = await response.json();
      setSearchResults(data);
      setLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to search users');
    }
  };

  const handleAddUser = userToAdd => {
    if (selectedUsers.some(u => u._id === userToAdd._id)) {
      return;
    }
    setSelectedUsers([...selectedUsers, userToAdd]);
    setSearch('');
    setSearchResults([]);
  };

  const handleRemoveUser = userToRemove => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userToRemove._id));
  };

  const handleSubmit = async () => {
    if (!groupChatName.trim() || selectedUsers.length === 0) {
      Alert.alert(
        'Error',
        'Please provide a group name and add at least one member',
      );
      return;
    }

    try {
      const response = await fetch(
        'https://chat-application-1795.onrender.com/api/chat/group',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            name: groupChatName,
            users: JSON.stringify(selectedUsers.map(u => u._id)),
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Add new group chat to existing chats
        setChats([data, ...chats]);
        setSelectedChat(data);

        // Reset form
        setGroupChatName('');
        setSelectedUsers([]);
        setSearch('');
        setSearchResults([]);

        // Refresh chats and close modal
        fetchChats();
        onClose();

        Alert.alert('Success', 'Group chat created successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to create group chat');
      }
    } catch (error) {
      console.error('Group chat creation error:', error);
      Alert.alert('Error', 'Failed to create group chat');
    }
  };

  const handleClose = () => {
    setGroupChatName('');
    setSelectedUsers([]);
    setSearch('');
    setSearchResults([]);
    onClose();
  };

  const renderSelectedUser = ({ item }) => (
    <View style={styles.selectedUserChip}>
      <Image source={{ uri: item.pic }} style={styles.selectedUserAvatar} />
      <Text style={styles.selectedUserName} numberOfLines={1}>
        {item.name}
      </Text>
      <TouchableOpacity
        onPress={() => handleRemoveUser(item)}
        style={styles.removeUserButton}>
        <Icon name="x" size={16} color="#EBE8DB" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleAddUser(item)}>
      <Image source={{ uri: item.pic }} style={styles.searchResultAvatar} />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="x" size={24} color="#3D0301" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Group Chat</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Group Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter a name for your group"
              placeholderTextColor="#8A0032"
              value={groupChatName}
              onChangeText={setGroupChatName}
              maxLength={50}
            />
          </View>

          {/* Add Members Section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Add Members</Text>
            <View style={styles.searchInputContainer}>
              <Icon
                name="search"
                size={20}
                color="#8A0032"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name or email"
                placeholderTextColor="#8A0032"
                value={search}
                onChangeText={handleSearch}
              />
            </View>
          </View>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedUsersSection}>
              <Text style={styles.selectedUsersLabel}>
                Selected Members ({selectedUsers.length})
              </Text>
              <FlatList
                data={selectedUsers}
                renderItem={renderSelectedUser}
                keyExtractor={item => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedUsersList}
              />
            </View>
          )}

          {/* Search Results */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8A0032" />
              <Text style={styles.loadingText}>Searching users...</Text>
            </View>
          ) : (
            searchResults.length > 0 && (
              <View style={styles.searchResultsSection}>
                <Text style={styles.searchResultsLabel}>Search Results</Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={item => item._id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.searchResultsList}
                />
              </View>
            )
          )}
        </ScrollView>

        {/* Create Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!groupChatName.trim() || selectedUsers.length === 0) &&
              styles.createButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!groupChatName.trim() || selectedUsers.length === 0}>
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EBE8DB',
    borderBottomWidth: 1,
    borderBottomColor: '#D76C82',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D0301',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputSection: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D0301',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D76C82',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3D0301',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D76C82',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3D0301',
  },
  selectedUsersSection: {
    marginTop: 20,
  },
  selectedUsersLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D0301',
    marginBottom: 12,
  },
  selectedUsersList: {
    paddingHorizontal: 4,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A0032',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    maxWidth: width * 0.4,
  },
  selectedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  selectedUserName: {
    color: '#EBE8DB',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  removeUserButton: {
    marginLeft: 8,
    padding: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#8A0032',
    fontSize: 16,
  },
  searchResultsSection: {
    marginTop: 20,
  },
  searchResultsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D0301',
    marginBottom: 12,
  },
  searchResultsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D76C82',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D76C82',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D0301',
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 14,
    color: '#8A0032',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#EBE8DB',
    borderTopWidth: 1,
    borderTopColor: '#D76C82',
  },
  createButton: {
    backgroundColor: '#8A0032',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#C0C0C0',
  },
  createButtonText: {
    color: '#EBE8DB',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GroupChatModal;
