import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Animated,
  TextInput,
  Keyboard,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {ChatState} from '../../Context/ChatProvider';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

const AnimatedSearchOverlay = ({isVisible, onClose}) => {
  const {user, chats, setChats, setSelectedChat} = ChatState();
  const navigation = useNavigation();

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Animation refs
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const searchBarTranslateY = useRef(new Animated.Value(-100)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const searchInputRef = useRef(null);
  const searchTimeout = useRef(null);

  // Animate in when visible
  useEffect(() => {
    if (isVisible) {
      // Reset states
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);

      // Animate in
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(searchBarTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Focus search input after animation
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      });
    }
  }, [isVisible]);

  // Animate out and close
  const handleClose = () => {
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(searchBarTranslateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 30,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Search functionality
  const searchUsers = async query => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(true);

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
      setIsSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const handleSearchChange = text => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce search
    searchTimeout.current = setTimeout(() => {
      searchUsers(text);
    }, 500);
  };

  const accessChat = async userId => {
    try {
      const response = await fetch(
        'https://chat-application-1795.onrender.com/api/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({userId}),
        },
      );

      const data = await response.json();

      if (!chats.find(c => c._id === data._id)) {
        setChats([data, ...chats]);
      }

      setSelectedChat(data);
      handleClose();
      navigation.navigate('Messages', {chat: data});
    } catch (error) {
      console.error('Error accessing chat:', error);
    }
  };

  const renderSearchResult = ({item}) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => accessChat(item._id)}>
      <Image
        source={{uri: item.pic || 'https://via.placeholder.com/50'}}
        style={styles.searchResultAvatar}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#8A0032" />
          <Text style={styles.emptyStateText}>Searching...</Text>
        </View>
      );
    }

    if (hasSearched && searchResults.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Icon name="search" size={50} color="#D76C82" />
          <Text style={styles.emptyStateTitle}>No users found</Text>
          <Text style={styles.emptyStateText}>
            Try searching with a different name or email
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Icon name="users" size={50} color="#D76C82" />
        <Text style={styles.emptyStateTitle}>Find Friends</Text>
        <Text style={styles.emptyStateText}>
          Search by name or email to find people to chat with
        </Text>
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: overlayOpacity,
        },
      ]}>
      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchBarContainer,
          {
            transform: [{translateY: searchBarTranslateY}],
          },
        ]}>
        <View style={styles.searchInputContainer}>
          <Icon
            name="search"
            size={20}
            color="#8A0032"
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search friends by name or email..."
            placeholderTextColor="#B03052"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Search Results */}
      <Animated.View
        style={[
          styles.searchResultsContainer,
          {
            opacity: contentOpacity,
            transform: [{translateY: contentTranslateY}],
          },
        ]}>
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={item => item._id}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.searchResultsList}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    zIndex: 1000,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60, // Account for status bar
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#3D0301',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    color: '#8A0032',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchResultsList: {
    padding: 16,
    flexGrow: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  searchResultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#8A0032',
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3D0301',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8A0032',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AnimatedSearchOverlay;
