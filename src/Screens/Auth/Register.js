import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Path, Circle } from 'react-native-svg';
import { ChatState } from '../../Context/ChatProvider';
import tw from 'twrnc';
const Signup = ({ setIsLogin }) => {
    const navigation = useNavigation();
    const { setUser } = ChatState();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFileUpload = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert("Permission Required", "You need to grant permission to access your photos");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                uploadImage(imageUri);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const uploadImage = async (uri) => {
        setUploading(true);

        try {
            const formData = new FormData();
            const filename = uri.split('/').pop();
            const fileType = filename.split('.').pop();

            formData.append("file", {
                uri,
                name: filename,
                type: `image/${fileType}`
            });
            formData.append("upload_preset", "ChatApp");

            const response = await fetch(
                "https://api.cloudinary.com/v1_1/dmxkerpjf/image/upload",
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const data = await response.json();
            setProfileImage(data.secure_url);
        } catch (error) {
            console.error("Upload failed", error);
            Alert.alert("Upload Failed", "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            setError("All fields are required!");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        // Password strength validation
        if (password.length < 6) {
            setError("Password must be at least 6 characters long!");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address!");
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(
                "https://chat-application-1795.onrender.com/api/user",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        pic: profileImage || "",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed");
                setIsLoading(false);
                return;
            }

            // Store user info in AsyncStorage
            await AsyncStorage.setItem("userInfo", JSON.stringify(data));

            // Update user in context
            setUser(data);

            // Navigate to chats
            setIsLoading(false);
            navigation.navigate("Chats");
        } catch (err) {
            console.error("Signup error", err);
            setError("Failed to register. Try again later.");
            setIsLoading(false);
        }
    };

    return (
        // <SafeAreaView className="signupContainer">
        //     <KeyboardAvoidingView
        //         behavior={Platform.OS === "ios" ? "padding" : "height"}
        //         className="keyboardAvoidView"
        //     >
        //         <ScrollView className="scrollView">
        //             <View className="headerContainer">
        //                 <View className="logoContainer">
        //                     <Text className="logoText">👻</Text>
        //                 </View>
        //                 <Text className="titleText">Join ChatUp</Text>
        //                 <Text className="subtitleText">
        //                     Create your account and start chatting
        //                 </Text>
        //             </View>

        //             <View className="formContainer">
        //                 {/* Error Message */}
        //                 {error ? (
        //                     <View className="errorContainer">
        //                         <Text className="errorText">{error}</Text>
        //                     </View>
        //                 ) : null}

        //                 {/* Name Input */}
        //                 <View className="inputContainer">
        //                     <View className="inputIconContainer">
        //                         <Svg width={14} height={14} viewBox="0 0 20 20" fill="#D76C82">
        //                             <Path
        //                                 fillRule="evenodd"
        //                                 d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        //                                 clipRule="evenodd"
        //                             />
        //                         </Svg>
        //                     </View>
        //                     <TextInput
        //                         className="textInput"
        //                         placeholder="Enter your name"
        //                         value={name}
        //                         onChangeText={setName}
        //                     />
        //                 </View>

        //                 {/* Email Input */}
        //                 <View className="inputContainer">
        //                     <View className="inputIconContainer">
        //                         <Svg width={14} height={14} viewBox="0 0 20 20" fill="#D76C82">
        //                             <Path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
        //                             <Path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        //                         </Svg>
        //                     </View>
        //                     <TextInput
        //                         className="textInput"
        //                         placeholder="Enter your email"
        //                         value={email}
        //                         onChangeText={setEmail}
        //                         keyboardType="email-address"
        //                         autoCapitalize="none"
        //                     />
        //                 </View>

        //                 {/* Password Input */}
        //                 <View className="passwordContainer">
        //                     <View className="inputContainer">
        //                         <View className="inputIconContainer">
        //                             <Svg width={14} height={14} viewBox="0 0 20 20" fill="#D76C82">
        //                                 <Path
        //                                     fillRule="evenodd"
        //                                     d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        //                                     clipRule="evenodd"
        //                                 />
        //                             </Svg>
        //                         </View>
        //                         <TextInput
        //                             className="textInput"
        //                             placeholder="Create a strong password"
        //                             value={password}
        //                             onChangeText={setPassword}
        //                             secureTextEntry={!showPassword}
        //                         />
        //                         <TouchableOpacity
        //                             className="passwordVisibilityButton"
        //                             onPress={() => setShowPassword(!showPassword)}
        //                         >
        //                             {showPassword ? (
        //                                 <Svg width={14} height={14} viewBox="0 0 20 20" fill="#D76C82">
        //                                     <Path
        //                                         fillRule="evenodd"
        //                                         d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
        //                                         clipRule="evenodd"
        //                                     />
        //                                     <Path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        //                                 </Svg>
        //                             ) : (
        //                                 <Svg width={14} height={14} viewBox="0 0 20 20" fill="#D76C82">
        //                                     <Path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        //                                     <Path
        //                                         fillRule="evenodd"
        //                                         d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        //                                         clipRule="evenodd"
        //                                     />
        //                                 </Svg>
        //                             )}
        //                         </TouchableOpacity>
        //                     </View>
        //                     {password.length > 0 && password.length < 6 && (
        //                         <Text className="passwordHintText">
        //                             Password must be at least 6 characters
        //                         </Text>
        //                     )}
        //                 </View>

        //                 {/* Confirm Password Input */}
        //                 <View className="inputContainer">
        //                     <View className="inputIconContainer">
        //                         <Svg width={14} height={14} viewBox="0 0 20 20" fill="#D76C82">
        //                             <Path
        //                                 fillRule="evenodd"
        //                                 d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        //                                 clipRule="evenodd"
        //                             />
        //                         </Svg>
        //                     </View>
        //                     <TextInput
        //                         className="textInput"
        //                         placeholder="Confirm your password"
        //                         value={confirmPassword}
        //                         onChangeText={setConfirmPassword}
        //                         secureTextEntry={true}
        //                     />
        //                 </View>
        //                 {password !== confirmPassword && confirmPassword.length > 0 && (
        //                     <Text className="passwordMismatchText">
        //                         Passwords do not match
        //                     </Text>
        //                 )}

        //                 {/* Profile Picture Upload */}
        //                 <View className="profileUploadContainer">
        //                     <View className="profileImagePreviewContainer">
        //                         {profileImage ? (
        //                             <Image
        //                                 source={{ uri: profileImage }}
        //                                 className="profileImage"
        //                             />
        //                         ) : (
        //                             <View className="profileImagePlaceholder">
        //                                 <Svg width={20} height={20} viewBox="0 0 20 20" fill="#D76C82">
        //                                     <Path
        //                                         fillRule="evenodd"
        //                                         d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        //                                         clipRule="evenodd"
        //                                     />
        //                                 </Svg>
        //                             </View>
        //                         )}
        //                     </View>

        //                     <TouchableOpacity
        //                         className="uploadButton"
        //                         onPress={handleFileUpload}
        //                         disabled={uploading}
        //                     >
        //                         <View className="uploadButtonContent">
        //                             <Svg width={12} height={12} viewBox="0 0 20 20" fill="#D76C82">
        //                                 <Path
        //                                     fillRule="evenodd"
        //                                     d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
        //                                     clipRule="evenodd"
        //                                 />
        //                             </Svg>
        //                             <Text className="uploadButtonText">
        //                                 {uploading
        //                                     ? "Uploading..."
        //                                     : profileImage
        //                                         ? "Change photo"
        //                                         : "Upload photo (optional)"}
        //                             </Text>
        //                             {uploading && <ActivityIndicator size="small" color="#D76C82" />}
        //                         </View>
        //                     </TouchableOpacity>
        //                 </View>

        //                 {/* Submit Button */}
        //                 <TouchableOpacity
        //                     className="submitButton"
        //                     onPress={handleSubmit}
        //                     disabled={isLoading}
        //                 >
        //                     {isLoading ? (
        //                         <View className="loadingContainer">
        //                             <ActivityIndicator size="small" color="#FFFFFF" />
        //                             <Text className="buttonText">Creating Account...</Text>
        //                         </View>
        //                     ) : (
        //                         <Text className="buttonText">Create Account</Text>
        //                     )}
        //                 </TouchableOpacity>
        //             </View>

        //             {/* Switch to Login */}
        //             <View className="switchContainer">
        //                 <Text className="switchText">
        //                     Already have an account?{" "}
        //                 </Text>
        //                 <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        //                     <Text className="switchButtonText">Sign In</Text>
        //                 </TouchableOpacity>
        //             </View>

        //             <View className="footerContainer">
        //                 <View className="footerContent">
        //                     <Text className="footerText">Made with ❤️ by</Text>
        //                     <TouchableOpacity
        //                         onPress={() => {
        //                             // Open link to portfolio
        //                             // You would use Linking from react-native here
        //                         }}
        //                     >
        //                         <View className="authorContainer">
        //                             <Text className="authorText">Arjun</Text>
        //                             <Svg width={10} height={10} viewBox="0 0 24 24" stroke="#B03052" fill="none">
        //                                 <Path
        //                                     strokeLinecap="round"
        //                                     strokeLinejoin="round"
        //                                     strokeWidth={2}
        //                                     d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        //                                 />
        //                             </Svg>
        //                         </View>
        //                     </TouchableOpacity>
        //                 </View>
        //             </View>
        //         </ScrollView>
        //     </KeyboardAvoidingView>
        // </SafeAreaView>
        <SafeAreaView style={tw`flex-1 bg-background`}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={tw`flex-1`}
            >
                <ScrollView
                    style={tw`flex-1`}
                    contentContainerStyle={tw`px-5 py-6`}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View style={tw`items-center mb-8`}>
                        <View style={tw`bg-primary w-16 h-16 rounded-full justify-center items-center mb-3 shadow-md`}>
                            <Text style={tw`text-2xl`}>👻</Text>
                        </View>
                        <Text style={tw`text-xl font-bold text-primary`}>Join ChatUp</Text>
                        <Text style={tw`text-xs text-secondary mt-1 text-center`}>
                            Create your account and start chatting
                        </Text>
                    </View>

                    <View style={tw`mb-6`}>
                        {/* Error Message */}
                        {error ? (
                            <View style={tw`bg-red-100 border-l-4 border-red-500 p-3 rounded-md mb-4`}>
                                <Text style={tw`text-red-700 text-xs`}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Name Input */}
                        <View style={tw`relative mb-4`}>
                            <View style={tw`absolute top-0 bottom-0 left-3 justify-center`}>
                                <Svg width={16} height={16} viewBox="0 0 20 20" fill="#D76C82">
                                    <Path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                    />
                                </Svg>
                            </View>
                            <TextInput
                                style={tw`bg-white border-2 border-accent rounded-xl py-3 pl-10 pr-4 text-gray-700 text-sm`}
                                placeholder="Enter your name"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Email Input */}
                        <View style={tw`relative mb-4`}>
                            <View style={tw`absolute top-0 bottom-0 left-3 justify-center`}>
                                <Svg width={16} height={16} viewBox="0 0 20 20" fill="#D76C82">
                                    <Path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <Path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </Svg>
                            </View>
                            <TextInput
                                style={tw`bg-white border-2 border-accent rounded-xl py-3 pl-10 pr-4 text-gray-700 text-sm`}
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={tw`mb-4`}>
                            <View style={tw`relative`}>
                                <View style={tw`absolute top-0 bottom-0 left-3 justify-center`}>
                                    <Svg width={16} height={16} viewBox="0 0 20 20" fill="#D76C82">
                                        <Path
                                            fillRule="evenodd"
                                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                            clipRule="evenodd"
                                        />
                                    </Svg>
                                </View>
                                <TextInput
                                    style={tw`bg-white border-2 border-accent rounded-xl py-3 pl-10 pr-12 text-gray-700 text-sm`}
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    style={tw`absolute top-0 bottom-0 right-3 justify-center`}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <Svg width={16} height={16} viewBox="0 0 20 20" fill="#D76C82">
                                            <Path
                                                fillRule="evenodd"
                                                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                                                clipRule="evenodd"
                                            />
                                            <Path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                        </Svg>
                                    ) : (
                                        <Svg width={16} height={16} viewBox="0 0 20 20" fill="#D76C82">
                                            <Path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <Path
                                                fillRule="evenodd"
                                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                clipRule="evenodd"
                                            />
                                        </Svg>
                                    )}
                                </TouchableOpacity>
                            </View>
                            {password.length > 0 && password.length < 6 && (
                                <Text style={tw`text-primary text-xs mt-1 ml-2`}>
                                    Password must be at least 6 characters
                                </Text>
                            )}
                        </View>

                        {/* Confirm Password Input */}
                        <View style={tw`relative mb-1`}>
                            <View style={tw`absolute top-0 bottom-0 left-3 justify-center`}>
                                <Svg width={16} height={16} viewBox="0 0 20 20" fill="#D76C82">
                                    <Path
                                        fillRule="evenodd"
                                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </Svg>
                            </View>
                            <TextInput
                                style={tw`bg-white border-2 border-accent rounded-xl py-3 pl-10 pr-4 text-gray-700 text-sm`}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={true}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        {password !== confirmPassword && confirmPassword.length > 0 && (
                            <Text style={tw`text-primary text-xs mb-4 ml-2`}>
                                Passwords do not match
                            </Text>
                        )}

                        {/* Profile Picture Upload */}
                        <View style={tw`flex-row items-center bg-white bg-opacity-90 p-3 rounded-xl mb-6 mt-4 border border-accent`}>
                            <View style={tw`mr-3`}>
                                {profileImage ? (
                                    <Image
                                        source={{ uri: profileImage }}
                                        style={tw`w-12 h-12 rounded-full border-2 border-secondary`}
                                    />
                                ) : (
                                    <View style={tw`w-12 h-12 rounded-full bg-secondary bg-opacity-20 justify-center items-center`}>
                                        <Svg width={22} height={22} viewBox="0 0 20 20" fill="#D76C82">
                                            <Path
                                                fillRule="evenodd"
                                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                                clipRule="evenodd"
                                            />
                                        </Svg>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={tw`flex-1 border border-dashed border-secondary rounded-lg py-2.5 px-3 ${uploading ? 'bg-gray-50 border-gray-300' : 'hover:bg-secondary hover:bg-opacity-10'}`}
                                onPress={handleFileUpload}
                                disabled={uploading}
                            >
                                <View style={tw`flex-row items-center justify-center`}>
                                    <Svg width={14} height={14} viewBox="0 0 20 20" fill={uploading ? "#9CA3AF" : "#D76C82"}>
                                        <Path
                                            fillRule="evenodd"
                                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </Svg>
                                    <Text style={tw`text-xs ml-1.5 ${uploading ? 'text-gray-400' : 'text-secondary'}`}>
                                        {uploading
                                            ? "Uploading..."
                                            : profileImage
                                                ? "Change photo"
                                                : "Upload photo (optional)"}
                                    </Text>
                                    {uploading && <ActivityIndicator size="small" color="#D76C82" style={tw`ml-1.5`} />}
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={tw`${isLoading ? 'bg-gray-400' : 'bg-primary'} py-3.5 rounded-xl shadow-md mb-2`}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <View style={tw`flex-row justify-center items-center`}>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={tw`text-white font-medium text-sm ml-2`}>Creating Account...</Text>
                                </View>
                            ) : (
                                <Text style={tw`text-white font-medium text-center text-sm`}>Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Switch to Login */}
                    <View style={tw`flex-row justify-center items-center mb-6`}>
                        <Text style={tw`text-secondary text-xs`}>
                            Already have an account?{" "}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                            <Text style={tw`text-primary font-medium text-xs`}>Sign In</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={tw`border-t border-accent pt-3`}>
                        <View style={tw`flex-row justify-center items-center`}>
                            <Text style={tw`text-secondary text-[10px]`}>Made with ❤️ by</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    // Open link to portfolio
                                    // You would use Linking from react-native here
                                }}
                            >
                                <View style={tw`flex-row items-center ml-1`}>
                                    <Text style={tw`text-primary font-medium text-[10px]`}>Arjun</Text>
                                    <Svg width={10} height={10} viewBox="0 0 24 24" stroke="#B03052" fill="none" style={tw`ml-0.5`}>
                                        <Path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </Svg>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Signup;