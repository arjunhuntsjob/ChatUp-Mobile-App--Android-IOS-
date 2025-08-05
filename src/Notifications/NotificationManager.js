import notifee, {
    AndroidImportance,
    AndroidVisibility,
    EventType,
    TriggerType,
} from '@notifee/react-native';
import { Platform, AppState } from 'react-native';

class NotificationManager {
    constructor() {
        this.channelId = 'chat-messages';
        this.currentChatId = null;
        this.appState = AppState.currentState;
        this.navigationRef = null;

        this.init();
    }

    async init() {
        // Request permissions
        await this.requestPermissions();

        // Create notification channel for Android
        if (Platform.OS === 'android') {
            await this.createChannel();
        }

        // Setup event listeners
        this.setupEventListeners();

        // Monitor app state
        AppState.addEventListener('change', this.handleAppStateChange);
    }

    async requestPermissions() {
        const settings = await notifee.requestPermission();

        if (settings.authorizationStatus >= 1) {
            console.log('Notification permissions granted');
        } else {
            console.log('Notification permissions denied');
        }

        return settings;
    }

    async createChannel() {
        const channelId = await notifee.createChannel({
            id: this.channelId,
            name: 'Chat Messages',
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
            sound: 'default',
            vibration: true,
            lights: true,
            lightColor: '#8A0032',
        });

        return channelId;
    }

    setupEventListeners() {
        // Handle foreground events (when app is open)
        notifee.onForegroundEvent(({ type, detail }) => {
            console.log('Foreground notification event:', type, detail);

            if (type === EventType.PRESS) {
                this.handleNotificationPress(detail.notification);
            }
        });

        // Handle background events (when app is closed/background)
        notifee.onBackgroundEvent(async ({ type, detail }) => {
            console.log('Background notification event:', type, detail);

            if (type === EventType.PRESS) {
                // Store the notification data for when app opens
                await this.storeNotificationForLater(detail.notification);
            }
        });
    }

    handleAppStateChange = (nextAppState) => {
        this.appState = nextAppState;
    };

    setNavigationRef(navigationRef) {
        this.navigationRef = navigationRef;
    }

    setCurrentChat(chatId) {
        this.currentChatId = chatId;
    }

    clearCurrentChat() {
        this.currentChatId = null;
    }

    async showMessageNotification(message, chat, sender) {
        // Don't show notification if:
        // 1. App is in foreground AND user is viewing this specific chat
        // 2. Message is from current user
        if (
            (this.appState === 'active' && this.currentChatId === chat._id) ||
            message.sender._id === sender._id
        ) {
            return;
        }

        const notificationTitle = chat.isGroupChat
            ? `${message.sender.name} in ${chat.chatName}`
            : message.sender.name;

        const notificationBody = message.content;

        try {
            await notifee.displayNotification({
                title: notificationTitle,
                body: notificationBody,
                android: {
                    channelId: this.channelId,
                    smallIcon: 'ic_launcher', // Make sure you have this icon
                    color: '#8A0032',
                    pressAction: {
                        id: 'open-chat',
                        launchActivity: 'default',
                    },
                    actions: [
                        {
                            title: 'Reply',
                            pressAction: {
                                id: 'reply',
                            },
                            input: {
                                allowFreeFormInput: true,
                                placeholder: 'Type your reply...',
                            },
                        },
                        {
                            title: 'Mark as Read',
                            pressAction: {
                                id: 'mark-read',
                            },
                        },
                    ],
                    style: {
                        type: 1, // BigTextStyle
                        text: notificationBody,
                    },
                },
                ios: {
                    sound: 'default',
                    categoryId: 'chat-message',
                    attachments: message.sender.pic ? [
                        {
                            url: message.sender.pic,
                            thumbnailHidden: false,
                        },
                    ] : [],
                },
                data: {
                    chatId: chat._id,
                    messageId: message._id,
                    senderId: message.sender._id,
                    chatName: chat.isGroupChat ? chat.chatName : message.sender.name,
                    isGroupChat: chat.isGroupChat.toString(),
                },
            });

            console.log('Notification displayed successfully');
        } catch (error) {
            console.error('Error displaying notification:', error);
        }
    }

    async handleNotificationPress(notification) {
        const { chatId, messageId } = notification.data || {};

        if (chatId && this.navigationRef) {
            // Navigate to the specific chat
            this.navigationRef.navigate('Messages', {
                chat: { _id: chatId },
                fromNotification: true,
                messageId: messageId,
            });
        }
    }

    async storeNotificationForLater(notification) {
        // Store notification data in AsyncStorage for when app opens
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('pendingNotification', JSON.stringify(notification));
        } catch (error) {
            console.error('Error storing notification:', error);
        }
    }

    async checkPendingNotification() {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const pendingNotification = await AsyncStorage.getItem('pendingNotification');

            if (pendingNotification) {
                const notification = JSON.parse(pendingNotification);
                await AsyncStorage.removeItem('pendingNotification');

                // Handle the notification
                setTimeout(() => {
                    this.handleNotificationPress(notification);
                }, 1000); // Small delay to ensure navigation is ready
            }
        } catch (error) {
            console.error('Error checking pending notification:', error);
        }
    }

    async getInitialNotification() {
        try {
            const initialNotification = await notifee.getInitialNotification();

            if (initialNotification) {
                console.log('App opened from notification (killed state):', initialNotification);

                // Handle the notification after a delay to ensure navigation is ready
                setTimeout(() => {
                    this.handleNotificationPress(initialNotification.notification);
                }, 2000);
            }
        } catch (error) {
            console.error('Error getting initial notification:', error);
        }
    }

    async cancelNotification(notificationId) {
        try {
            await notifee.cancelNotification(notificationId);
        } catch (error) {
            console.error('Error canceling notification:', error);
        }
    }

    async cancelAllNotifications() {
        try {
            await notifee.cancelAllNotifications();
        } catch (error) {
            console.error('Error canceling all notifications:', error);
        }
    }

    async getBadgeCount() {
        try {
            return await notifee.getBadgeCount();
        } catch (error) {
            console.error('Error getting badge count:', error);
            return 0;
        }
    }

    async setBadgeCount(count) {
        try {
            await notifee.setBadgeCount(count);
        } catch (error) {
            console.error('Error setting badge count:', error);
        }
    }

    // iOS specific setup
    async setupiOSCategories() {
        if (Platform.OS === 'ios') {
            await notifee.setNotificationCategories([
                {
                    id: 'chat-message',
                    actions: [
                        {
                            id: 'reply',
                            title: 'Reply',
                            input: true,
                        },
                        {
                            id: 'mark-read',
                            title: 'Mark as Read',
                        },
                    ],
                },
            ]);
        }
    }

    // Test notification method
    async showTestNotification() {
        await notifee.displayNotification({
            title: 'Test Notification',
            body: 'This is a test notification from your chat app!',
            android: {
                channelId: this.channelId,
                smallIcon: 'ic_launcher',
                color: '#8A0032',
            },
            ios: {
                sound: 'default',
            },
        });
    }
}

// Create and export singleton instance
const notificationManager = new NotificationManager();
export default notificationManager;