import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator
} from 'react-native';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-community/async-storage';

export default function LogScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function LogInPress() {
        setLoading(true)
        await fetch('http://159.203.8.120:3001/api/v1/users/login', {
            method: "POST",
            headers: {
                "Authorization": "Basic Og==",
                "Content-Type": "application/json",
                "Accept": "applicaton/json"
            },
            body: JSON.stringify({

                email: email,
                password: password,

            })
        }).then((response) => response.json())
            .then((responseJson) => {
                setLoading(false)
                console.log("Response", responseJson);
                AsyncStorage.setItem("TOKEN", responseJson.accessToken);
                // if (responseJson.message == 'Please enter valid email address') {
                //     alert("Pleae enter valid Email and Password")
                // }
                // if (responseJson.message == 'Password should be minimum of 8 characters') {
                //     alert("Please Enter a Valid Password")
                // }
                // if (responseJson.message == 'Invalid email or password') {
                //     alert("Invalid email or password")
                // }
                if (responseJson.status == "OK") {
                    navigation.navigate("Users Screen")
                }
            })
    }

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="small" color="white" />
            </View>
        )
    } else {
        return (
            <View style={Styles.container}>
                <View style={Styles.logoContainer}>
                    <Image
                        source={{ uri: "https://miro.medium.com/max/1000/1*GkR93AAlILkmE_3QQf88Ug.png" }}
                        style={{ height: 100, width: 100, resizeMode: 'contain' }}
                    />
                </View>
                <View style={Styles.userNameContainer}>
                    <TextInput
                        style={Styles.userNameInput}
                        onChangeText={(text) => setEmail(text)}
                        placeholder="Enter Your Email"
                        placeholderTextColor="lightgrey"
                    />
                </View>
                <View style={Styles.passwordContainer}>
                    <TextInput
                        secureTextEntry={true}
                        style={Styles.passwordInput}
                        onChangeText={(text) => setPassword(text)}
                        placeholder="Password"
                        placeholderTextColor="lightgrey"
                    />
                </View>
                <View style={Styles.forgotPasswordContainer}>
                    <TouchableOpacity>
                        <Text style={Styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={Styles.loginContainer}
                    onPress={LogInPress}>
                    <Text style={Styles.loginText}>LogIn</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const Styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    logoContainer: {
        alignItems: 'center',
    },
    userNameContainer: {
        borderColor: '#ececec',
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderRadius: 5,
        height: 40,
        justifyContent: 'center',
        marginStart: 20,
        marginEnd: 20,
        marginTop: 20,
        marginBottom: 20,
    },
    userNameInput: {
        borderWidth: 1,
        borderColor: "#000",
    },
    passwordContainer: {
        borderColor: '#000',
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderRadius: 5,
        height: 40,
        justifyContent: 'center',
        marginStart: 20,
        marginEnd: 20,
        marginEnd: 20,
        marginBottom: 20,
    },
    passwordInput: { marginStart: 10 },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginEnd: 20,
    },
    forgotPasswordText: {
        color: '#0088f8',
    },
    loginContainer: {
        alignItems: 'center',
        height: 40,
        marginTop: 30,
        backgroundColor: '#0088f8',
        justifyContent: 'center',
        marginStart: 20,
        marginEnd: 20,
        borderRadius: 5,
    },
    loginText: {
        color: '#fff',
    },
});