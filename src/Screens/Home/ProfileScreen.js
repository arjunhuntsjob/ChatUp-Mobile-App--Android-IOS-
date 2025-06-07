import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChatState} from '../../Context/ChatProvider';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {user, setUser} = ChatState();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [pic, setPic] = useState(user.pic);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: false,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel || response.error) {
        return;
      }

      const asset = response.assets[0];
      if (!asset) return;

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || 'profile.jpg',
      });
      formData.append('upload_preset', 'ChatApp');

      try {
        setLoading(true);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/dmxkerpjf/image/upload`,
          {
            method: 'POST',
            body: formData,
          },
        );
        const data = await res.json();
        setPic(data.secure_url);
      } catch (err) {
        console.error('Upload failed', err);
        Alert.alert('Error', 'Failed to upload image');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `https://chat-application-1795.onrender.com/api/user/updateProfile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            name,
            pic,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();

      const updatedUserInfo = {
        ...user,
        name: updatedUser.name,
        pic: updatedUser.pic,
        token: updatedUser.token,
      };

      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      setUser(updatedUserInfo);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Profile update failed', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user.name);
    setPic(user.pic);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#8A0032" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Profile Image Section */}
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={{
                  uri: pic || 'https://via.placeholder.com/150',
                }}
                style={styles.profileImage}
              />
              {isEditing && (
                <TouchableOpacity
                  style={styles.editImageButton}
                  onPress={handleImageUpload}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Icon name="camera" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Name Section */}
          <View style={styles.nameSection}>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#B03052"
                editable={!loading}
                maxLength={50}
              />
            ) : (
              <Text style={styles.nameText}>{name}</Text>
            )}
          </View>

          {/* Email Section */}
          <View style={styles.emailSection}>
            <Text style={styles.emailLabel}>Email</Text>
            <Text style={styles.emailText}>{user.email}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <View style={styles.editingButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="check" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={loading}>
                  <Icon name="x" size={20} color="#666666" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}>
                <Icon name="edit-2" size={20} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Stats/Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Icon name="message-circle" size={24} color="#8A0032" />
              <Text style={styles.infoCardTitle}>Messages</Text>
              <Text style={styles.infoCardSubtitle}>Stay connected</Text>
            </View>
            <View style={styles.infoCard}>
              <Icon name="users" size={24} color="#8A0032" />
              <Text style={styles.infoCardTitle}>Groups</Text>
              <Text style={styles.infoCardSubtitle}>Join conversations</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8A0032',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#D76C82',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D76C82',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A0032',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#D76C82',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 200,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8A0032',
    textAlign: 'center',
  },
  emailSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 18,
    color: '#B03052',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  editingButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
  },
  editButton: {
    backgroundColor: '#D76C82',
    alignSelf: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#8A0032',
    flex: 1,
    maxWidth: 120,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    flex: 1,
    maxWidth: 120,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D0301',
    marginTop: 8,
    marginBottom: 4,
  },
  infoCardSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default ProfileScreen;
