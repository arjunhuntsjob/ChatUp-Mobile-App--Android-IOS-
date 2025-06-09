// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Image,
//   FlatList,
//   StyleSheet,
//   Modal,
//   TextInput,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Feather';

// const GroupChatDetailsModal = ({
//   visible,
//   chat,
//   user,
//   onClose,
//   onUpdateChat,
// }) => {
//   const [groupName, setGroupName] = useState(chat?.chatName || '');
//   const [selectedUsersToRemove, setSelectedUsersToRemove] = useState([]);
//   const [searchUsers, setSearchUsers] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchLoading, setSearchLoading] = useState(false);

//   useEffect(() => {
//     if (chat) {
//       setGroupName(chat.chatName);
//     }
//   }, [chat]);

//   // Search Users to Add
//   const handleSearchUsers = async () => {
//     if (!searchUsers.trim()) {
//       setSearchResults([]);
//       return;
//     }

//     try {
//       setSearchLoading(true);
//       const response = await fetch(
//         `https://chat-application-1795.onrender.com/api/user?search=${searchUsers}`,
//         {
//           method: 'GET',
//           headers: {
//             Authorization: `Bearer ${user.token}`,
//           },
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to search users');
//       }

//       const data = await response.json();

//       // Filter out users already in the group
//       const filteredUsers = data.filter(
//         searchUser =>
//           !chat.users.some(groupUser => groupUser._id === searchUser._id),
//       );

//       setSearchResults(filteredUsers);
//     } catch (error) {
//       console.error('Error searching users:', error);
//       Alert.alert('Error', error.message || 'Failed to search users');
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   // Remove Users from Group
//   const handleRemoveUsers = async () => {
//     if (selectedUsersToRemove.length === 0) {
//       Alert.alert('Error', 'Please select users to remove');
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await fetch(
//         'https://chat-application-1795.onrender.com/api/chat/groupremove',
//         {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${user.token}`,
//           },
//           body: JSON.stringify({
//             chatId: chat._id,
//             userId: selectedUsersToRemove[0],
//           }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to remove users');
//       }

//       const updatedChat = await response.json();
//       onUpdateChat(updatedChat);
//       setSelectedUsersToRemove([]);
//     } catch (error) {
//       console.error('Error removing users:', error);
//       Alert.alert('Error', error.message || 'Failed to remove users');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Add Users to Group
//   const handleAddUsers = async () => {
//     if (selectedUsersToAdd.length === 0) {
//       Alert.alert('Error', 'Please select users to add');
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await fetch(
//         'https://chat-application-1795.onrender.com/api/chat/groupadd',
//         {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${user.token}`,
//           },
//           body: JSON.stringify({
//             chatId: chat._id,
//             userId: selectedUsersToAdd,
//           }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to add users');
//       }

//       const updatedChat = await response.json();
//       onUpdateChat(updatedChat);
//       setSearchUsers('');
//       setSearchResults([]);
//       setSelectedUsersToAdd([]);
//     } catch (error) {
//       console.error('Error adding users:', error);
//       Alert.alert('Error', error.message || 'Failed to add users');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Leave Group
//   const handleLeaveGroup = async () => {
//     Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
//       {
//         text: 'Cancel',
//         style: 'cancel',
//       },
//       {
//         text: 'Leave',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             setLoading(true);
//             const response = await fetch(
//               'https://chat-application-1795.onrender.com/api/chat/groupremove',
//               {
//                 method: 'PUT',
//                 headers: {
//                   'Content-Type': 'application/json',
//                   Authorization: `Bearer ${user.token}`,
//                 },
//                 body: JSON.stringify({
//                   chatId: chat._id,
//                 }),
//               },
//             );

//             if (!response.ok) {
//               const errorData = await response.json();
//               throw new Error(errorData.message || 'Failed to leave group');
//             }

//             onUpdateChat(null);
//             onClose();
//           } catch (error) {
//             console.error('Error leaving group:', error);
//             Alert.alert('Error', error.message || 'Failed to leave group');
//           } finally {
//             setLoading(false);
//           }
//         },
//       },
//     ]);
//   };

//   // Rename Group
//   const handleUpdateGroupName = async () => {
//     if (!groupName.trim()) {
//       Alert.alert('Error', 'Group name cannot be empty');
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await fetch(
//         'https://chat-application-1795.onrender.com/api/chat/rename',
//         {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${user.token}`,
//           },
//           body: JSON.stringify({
//             chatId: chat._id,
//             chatName: groupName,
//           }),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to update group name');
//       }

//       const updatedChat = await response.json();
//       onUpdateChat(updatedChat);
//       Alert.alert('Success', 'Group name updated successfully');
//     } catch (error) {
//       console.error('Error updating group name:', error);
//       Alert.alert('Error', error.message || 'Failed to update group name');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleUserSelection = (userId, isForRemoval) => {
//     if (isForRemoval) {
//       setSelectedUsersToRemove(prev =>
//         prev.includes(userId)
//           ? prev.filter(id => id !== userId)
//           : [...prev, userId],
//       );
//     } else {
//       setSelectedUsersToAdd(prev =>
//         prev.includes(userId)
//           ? prev.filter(id => id !== userId)
//           : [...prev, userId],
//       );
//     }
//   };

//   const renderSearchUser = ({item}) => (
//     <TouchableOpacity
//       style={styles.userItem}
//       onPress={() => toggleUserSelection(item._id, false)}>
//       <View style={styles.userInfo}>
//         <Image source={{uri: item.pic}} style={styles.userAvatar} />
//         <Text style={styles.userName}>{item.name}</Text>
//       </View>
//       <View style={styles.checkbox}>
//         {selectedUsersToAdd.includes(item._id) && (
//           <Icon name="check" size={16} color="#8A0032" />
//         )}
//       </View>
//     </TouchableOpacity>
//   );

//   const renderGroupMember = ({item}) => (
//     <View style={styles.memberItem}>
//       <View style={styles.memberInfo}>
//         <Image source={{uri: item.pic}} style={styles.memberAvatar} />
//         <View>
//           <Text style={styles.memberName}>{item.name}</Text>
//           {item._id === chat.groupAdmin._id && (
//             <Text style={styles.adminBadge}>Admin</Text>
//           )}
//         </View>
//       </View>
//       {chat.groupAdmin._id === user._id && item._id !== user._id && (
//         <TouchableOpacity
//           style={styles.checkbox}
//           onPress={() => toggleUserSelection(item._id, true)}>
//           {selectedUsersToRemove.includes(item._id) && (
//             <Icon name="check" size={16} color="#8A0032" />
//           )}
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   if (!chat) return null;

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}>
//       <View style={styles.container}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Group Details</Text>
//           <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//             <Icon name="x" size={24} color="#8A0032" />
//           </TouchableOpacity>
//         </View>

//         <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//           {/* Group Name Edit */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Group Name</Text>
//             <View style={styles.inputContainer}>
//               <TextInput
//                 style={[
//                   styles.textInput,
//                   chat.groupAdmin._id !== user._id && styles.disabledInput,
//                 ]}
//                 value={groupName}
//                 onChangeText={setGroupName}
//                 editable={chat.groupAdmin._id === user._id}
//                 placeholder="Enter group name"
//                 placeholderTextColor="#999999"
//               />
//               {chat.groupAdmin._id === user._id && (
//                 <TouchableOpacity
//                   style={styles.updateButton}
//                   onPress={handleUpdateGroupName}
//                   disabled={loading}>
//                   <Text style={styles.updateButtonText}>Update</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>

//           {/* Add Users (for admin) */}
//           {chat.groupAdmin._id === user._id && (
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Add Users to Group</Text>
//               <View style={styles.inputContainer}>
//                 <TextInput
//                   style={styles.textInput}
//                   placeholder="Search users"
//                   placeholderTextColor="#999999"
//                   value={searchUsers}
//                   onChangeText={setSearchUsers}
//                 />
//                 <TouchableOpacity
//                   style={styles.searchButton}
//                   onPress={handleSearchUsers}
//                   disabled={searchLoading}>
//                   {searchLoading ? (
//                     <ActivityIndicator size="small" color="#EBE8DB" />
//                   ) : (
//                     <Text style={styles.searchButtonText}>Search</Text>
//                   )}
//                 </TouchableOpacity>
//               </View>

//               {/* Search Results */}
//               {searchResults.length > 0 && (
//                 <View style={styles.searchResultsContainer}>
//                   <FlatList
//                     data={searchResults}
//                     renderItem={renderSearchUser}
//                     keyExtractor={item => item._id}
//                     style={styles.searchResults}
//                     nestedScrollEnabled={true}
//                   />
//                 </View>
//               )}

//               {/* Add Users Button */}
//               {selectedUsersToAdd.length > 0 && (
//                 <TouchableOpacity
//                   style={styles.actionButton}
//                   onPress={handleAddUsers}
//                   disabled={loading}>
//                   <Icon name="plus" size={20} color="#EBE8DB" />
//                   <Text style={styles.actionButtonText}>
//                     Add {selectedUsersToAdd.length} User
//                     {selectedUsersToAdd.length > 1 ? 's' : ''}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           )}

//           {/* Group Members */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Group Members</Text>
//             <View style={styles.membersContainer}>
//               <FlatList
//                 data={chat.users}
//                 renderItem={renderGroupMember}
//                 keyExtractor={item => item._id}
//                 style={styles.membersList}
//                 nestedScrollEnabled={true}
//               />
//             </View>

//             {/* Remove Member Button (for admin) */}
//             {chat.groupAdmin._id === user._id &&
//               selectedUsersToRemove.length > 0 && (
//                 <TouchableOpacity
//                   style={[styles.actionButton, styles.removeButton]}
//                   onPress={handleRemoveUsers}
//                   disabled={loading}>
//                   <Icon name="trash-2" size={20} color="#EBE8DB" />
//                   <Text style={styles.actionButtonText}>
//                     Remove {selectedUsersToRemove.length} Member
//                     {selectedUsersToRemove.length > 1 ? 's' : ''}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//           </View>

//           {/* Leave Group Button */}
//           <TouchableOpacity
//             style={[styles.actionButton, styles.leaveButton]}
//             onPress={handleLeaveGroup}
//             disabled={loading}>
//             <Icon name="log-out" size={20} color="#EBE8DB" />
//             <Text style={styles.actionButtonText}>Leave Group</Text>
//           </TouchableOpacity>
//         </ScrollView>

//         {/* Loading Overlay */}
//         {loading && (
//           <View style={styles.loadingOverlay}>
//             <ActivityIndicator size="large" color="#8A0032" />
//             <Text style={styles.loadingText}>Please wait...</Text>
//           </View>
//         )}
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#EBE8DB',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#8A0032',
//     borderBottomWidth: 2,
//     borderBottomColor: '#D76C82',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#EBE8DB',
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(235, 232, 219, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#3D0301',
//     marginBottom: 12,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   textInput: {
//     flex: 1,
//     borderWidth: 2,
//     borderColor: '#D76C82',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     backgroundColor: '#FFFFFF',
//     color: '#3D0301',
//     fontSize: 16,
//   },
//   disabledInput: {
//     backgroundColor: '#F5F5F5',
//     color: '#999999',
//   },
//   updateButton: {
//     backgroundColor: '#8A0032',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 8,
//     marginLeft: 8,
//   },
//   updateButtonText: {
//     color: '#EBE8DB',
//     fontWeight: '600',
//   },
//   searchButton: {
//     backgroundColor: '#8A0032',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 8,
//     marginLeft: 8,
//     minWidth: 80,
//     alignItems: 'center',
//   },
//   searchButtonText: {
//     color: '#EBE8DB',
//     fontWeight: '600',
//   },
//   searchResultsContainer: {
//     marginTop: 12,
//     maxHeight: 200,
//     borderWidth: 2,
//     borderColor: '#D76C82',
//     borderRadius: 8,
//     backgroundColor: '#FFFFFF',
//   },
//   searchResults: {
//     maxHeight: 200,
//   },
//   userItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#D76C82',
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   userAvatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: '#8A0032',
//   },
//   userName: {
//     fontSize: 16,
//     color: '#3D0301',
//     flex: 1,
//   },
//   checkbox: {
//     width: 24,
//     height: 24,
//     borderWidth: 2,
//     borderColor: '#8A0032',
//     borderRadius: 4,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   membersContainer: {
//     borderWidth: 2,
//     borderColor: '#D76C82',
//     borderRadius: 8,
//     backgroundColor: '#FFFFFF',
//     maxHeight: 300,
//   },
//   membersList: {
//     maxHeight: 300,
//   },
//   memberItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#D76C82',
//   },
//   memberInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   memberAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//     borderWidth: 2,
//     borderColor: '#8A0032',
//   },
//   memberName: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#3D0301',
//   },
//   adminBadge: {
//     fontSize: 10,
//     color: '#EBE8DB',
//     backgroundColor: '#8A0032',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 8,
//     marginTop: 2,
//     alignSelf: 'flex-start',
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#8A0032',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     marginTop: 12,
//   },
//   removeButton: {
//     backgroundColor: '#8A0032',
//   },
//   leaveButton: {
//     backgroundColor: '#8A0032',
//     marginTop: 24,
//   },
//   actionButtonText: {
//     color: '#EBE8DB',
//     fontWeight: '600',
//     fontSize: 16,
//     marginLeft: 8,
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(235, 232, 219, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#8A0032',
//   },
// });

// export default GroupChatDetailsModal;
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const GroupChatDetailsModal = ({
  visible,
  chat,
  user,
  onClose,
  onUpdateChat,
}) => {
  const [groupName, setGroupName] = useState(chat?.chatName || '');
  const [selectedUsersToRemove, setSelectedUsersToRemove] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (chat) {
      setGroupName(chat.chatName);
    }
  }, [chat]);

  // Search Users to Add
  const handleSearchUsers = async () => {
    if (!searchUsers.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(
        `https://chat-application-1795.onrender.com/api/user?search=${searchUsers}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search users');
      }

      const data = await response.json();

      // Filter out users already in the group
      const filteredUsers = data.filter(
        searchUser =>
          !chat.users.some(groupUser => groupUser._id === searchUser._id),
      );

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', error.message || 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  // Remove Users from Group
  const handleRemoveUsers = async () => {
    if (selectedUsersToRemove.length === 0) {
      Alert.alert('Error', 'Please select users to remove');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        'https://chat-application-1795.onrender.com/api/chat/groupremove',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            chatId: chat._id,
            userId: selectedUsersToRemove[0],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove users');
      }

      const updatedChat = await response.json();
      onUpdateChat(updatedChat);
      setSelectedUsersToRemove([]);
    } catch (error) {
      console.error('Error removing users:', error);
      Alert.alert('Error', error.message || 'Failed to remove users');
    } finally {
      setLoading(false);
    }
  };

  // Add Users to Group
  const handleAddUsers = async () => {
    if (selectedUsersToAdd.length === 0) {
      Alert.alert('Error', 'Please select users to add');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        'https://chat-application-1795.onrender.com/api/chat/groupadd',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            chatId: chat._id,
            userId: selectedUsersToAdd,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add users');
      }

      const updatedChat = await response.json();
      onUpdateChat(updatedChat);
      setSearchUsers('');
      setSearchResults([]);
      setSelectedUsersToAdd([]);
    } catch (error) {
      console.error('Error adding users:', error);
      Alert.alert('Error', error.message || 'Failed to add users');
    } finally {
      setLoading(false);
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(
              'https://chat-application-1795.onrender.com/api/chat/groupremove',
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                  chatId: chat._id,
                }),
              },
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to leave group');
            }

            onUpdateChat(null);
            onClose();
          } catch (error) {
            console.error('Error leaving group:', error);
            Alert.alert('Error', error.message || 'Failed to leave group');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Rename Group
  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        'https://chat-application-1795.onrender.com/api/chat/rename',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            chatId: chat._id,
            chatName: groupName,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update group name');
      }

      const updatedChat = await response.json();
      onUpdateChat(updatedChat);
      Alert.alert('Success', 'Group name updated successfully');
    } catch (error) {
      console.error('Error updating group name:', error);
      Alert.alert('Error', error.message || 'Failed to update group name');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId, isForRemoval) => {
    if (isForRemoval) {
      setSelectedUsersToRemove(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId],
      );
    } else {
      setSelectedUsersToAdd(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId],
      );
    }
  };

  const renderSearchUser = ({item}) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => toggleUserSelection(item._id, false)}>
      <View style={styles.userInfo}>
        <Image source={{uri: item.pic}} style={styles.userAvatar} />
        <Text style={styles.userName}>{item.name}</Text>
      </View>
      <View style={styles.checkbox}>
        {selectedUsersToAdd.includes(item._id) && (
          <Icon name="check" size={16} color="#8A0032" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderGroupMember = ({item}) => (
    <View style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <Image source={{uri: item.pic}} style={styles.memberAvatar} />
        <View>
          <Text style={styles.memberName}>{item.name}</Text>
          {item._id === chat.groupAdmin._id && (
            <Text style={styles.adminBadge}>Admin</Text>
          )}
        </View>
      </View>
      {chat.groupAdmin._id === user._id && item._id !== user._id && (
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleUserSelection(item._id, true)}>
          {selectedUsersToRemove.includes(item._id) && (
            <Icon name="check" size={16} color="#8A0032" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  // Prepare data for single FlatList
  const getSectionData = () => {
    const sections = [];

    // Group Name Section
    sections.push({
      type: 'groupName',
      key: 'groupName',
    });

    // Add Users Section (for admin)
    if (chat.groupAdmin._id === user._id) {
      sections.push({
        type: 'addUsers',
        key: 'addUsers',
      });

      // Search Results
      if (searchResults.length > 0) {
        searchResults.forEach((user, index) => {
          sections.push({
            type: 'searchUser',
            key: `searchUser_${user._id}`,
            data: user,
          });
        });
      }

      // Add Users Button
      if (selectedUsersToAdd.length > 0) {
        sections.push({
          type: 'addButton',
          key: 'addButton',
        });
      }
    }

    // Group Members Section
    sections.push({
      type: 'membersHeader',
      key: 'membersHeader',
    });

    // Group Members
    chat.users.forEach(member => {
      sections.push({
        type: 'member',
        key: `member_${member._id}`,
        data: member,
      });
    });

    // Remove Members Button (for admin)
    if (chat.groupAdmin._id === user._id && selectedUsersToRemove.length > 0) {
      sections.push({
        type: 'removeButton',
        key: 'removeButton',
      });
    }

    // Leave Group Button
    sections.push({
      type: 'leaveButton',
      key: 'leaveButton',
    });

    return sections;
  };

  const renderSectionItem = ({item}) => {
    switch (item.type) {
      case 'groupName':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  chat.groupAdmin._id !== user._id && styles.disabledInput,
                ]}
                value={groupName}
                onChangeText={setGroupName}
                editable={chat.groupAdmin._id === user._id}
                placeholder="Enter group name"
                placeholderTextColor="#999999"
              />
              {chat.groupAdmin._id === user._id && (
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdateGroupName}
                  disabled={loading}>
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'addUsers':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Users to Group</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Search users"
                placeholderTextColor="#999999"
                value={searchUsers}
                onChangeText={setSearchUsers}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchUsers}
                disabled={searchLoading}>
                {searchLoading ? (
                  <ActivityIndicator size="small" color="#EBE8DB" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'searchUser':
        return renderSearchUser({item: item.data});

      case 'addButton':
        return (
          <TouchableOpacity
            style={[styles.actionButton, {marginHorizontal: 20}]}
            onPress={handleAddUsers}
            disabled={loading}>
            <Icon name="plus" size={20} color="#EBE8DB" />
            <Text style={styles.actionButtonText}>
              Add {selectedUsersToAdd.length} User
              {selectedUsersToAdd.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        );

      case 'membersHeader':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group Members</Text>
          </View>
        );

      case 'member':
        return renderGroupMember({item: item.data});

      case 'removeButton':
        return (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.removeButton,
              {marginHorizontal: 20},
            ]}
            onPress={handleRemoveUsers}
            disabled={loading}>
            <Icon name="trash-2" size={20} color="#EBE8DB" />
            <Text style={styles.actionButtonText}>
              Remove {selectedUsersToRemove.length} Member
              {selectedUsersToRemove.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        );

      case 'leaveButton':
        return (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.leaveButton,
              {marginHorizontal: 20},
            ]}
            onPress={handleLeaveGroup}
            disabled={loading}>
            <Icon name="log-out" size={20} color="#EBE8DB" />
            <Text style={styles.actionButtonText}>Leave Group</Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  if (!chat) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Group Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={24} color="#8A0032" />
          </TouchableOpacity>
        </View>

        {/* Single FlatList for all content */}
        <FlatList
          data={getSectionData()}
          renderItem={renderSectionItem}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8A0032" />
            <Text style={styles.loadingText}>Please wait...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBE8DB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#8A0032',
    borderBottomWidth: 2,
    borderBottomColor: '#D76C82',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EBE8DB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(235, 232, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D0301',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D76C82',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    color: '#3D0301',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999999',
  },
  updateButton: {
    backgroundColor: '#8A0032',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  updateButtonText: {
    color: '#EBE8DB',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#8A0032',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#EBE8DB',
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#D76C82',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#8A0032',
  },
  userName: {
    fontSize: 16,
    color: '#3D0301',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#8A0032',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#D76C82',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 4,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#8A0032',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3D0301',
  },
  adminBadge: {
    fontSize: 10,
    color: '#EBE8DB',
    backgroundColor: '#8A0032',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A0032',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  removeButton: {
    backgroundColor: '#8A0032',
  },
  leaveButton: {
    backgroundColor: '#8A0032',
    marginTop: 24,
  },
  actionButtonText: {
    color: '#EBE8DB',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(235, 232, 219, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8A0032',
  },
});

export default GroupChatDetailsModal;
