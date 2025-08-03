import NetInfo from '@react-native-community/netinfo';

class NetworkHelper {
  constructor() {
    this.isConnected = true;
    this.listeners = [];
  }

  // Initialize network listener
  init() {
    NetInfo.addEventListener(state => {
      this.isConnected = state.isConnected;
      this.notifyListeners(state.isConnected);
    });
  }

  // Check current network status
  async checkConnection() {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected;
    return state.isConnected;
  }

  // Add network status listener
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove network status listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(isConnected) {
    this.listeners.forEach(callback => callback(isConnected));
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

export default new NetworkHelper();
