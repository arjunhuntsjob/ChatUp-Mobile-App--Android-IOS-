import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {ChatState} from '../../Context/ChatProvider';

const {width, height} = Dimensions.get('window');

const NotificationDropdown = ({isVisible, onClose, onNotificationPress}) => {
  const {notification, setNotification, removeNotification} = ChatState();
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleNotificationClick = notificationItem => {
    if (!notificationItem || !notificationItem.chat) {
      console.error('Invalid notification', notificationItem);
      return;
    }

    // Remove the notification using the context method
    removeNotification(notificationItem.chat._id);

    // Call the parent handler to navigate to chat
    onNotificationPress(notificationItem);
    onClose();
  };

  const renderNotificationItem = notif => (
    <TouchableOpacity
      key={notif._id}
      style={styles.notificationItem}
      onPress={() => handleNotificationClick(notif)}
      activeOpacity={0.7}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationDot} />
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>
            New message from{' '}
            <Text style={styles.senderName}>
              {notif.chat.isGroupChat ? notif.chat.chatName : notif.sender.name}
            </Text>
          </Text>
          {notif.content && (
            <Text style={styles.messagePreview} numberOfLines={1}>
              {notif.content}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, {opacity: opacityAnim}]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dropdownContainer,
                {transform: [{translateY: slideAnim}]},
              ]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="x" size={20} color="#EBE8DB" />
                </TouchableOpacity>
              </View>

              {/* Notification List */}
              <View style={styles.notificationList}>
                {notification.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icon
                      name="bell-off"
                      size={40}
                      color="#8A0032"
                      style={styles.emptyIcon}
                    />
                    <Text style={styles.emptyTitle}>No new notifications</Text>
                    <Text style={styles.emptySubtitle}>
                      You're all caught up!
                    </Text>
                  </View>
                ) : (
                  notification.map(renderNotificationItem)
                )}
              </View>

              {/* Clear All Button (only show if there are notifications) */}
              {notification.length > 0 && (
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.clearAllButton}
                    onPress={() => {
                      setNotification([]);
                      onClose();
                    }}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  dropdownContainer: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: '#EBE8DB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#8A0032',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#EBE8DB',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  notificationList: {
    maxHeight: height * 0.5,
  },
  notificationItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(215, 108, 130, 0.2)',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D76C82',
    marginTop: 6,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    color: '#3D0301',
    lineHeight: 20,
  },
  senderName: {
    fontWeight: 'bold',
    color: '#8A0032',
  },
  messagePreview: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A0032',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(215, 108, 130, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  clearAllButton: {
    backgroundColor: '#D76C82',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAllText: {
    color: '#EBE8DB',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NotificationDropdown;
