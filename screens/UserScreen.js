import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import io from "socket.io-client";
import AsyncStorage from '@react-native-community/async-storage';

const UserList = ({ navigation }) => {
    const [yourID, setYourID] = useState();
    const [text, setText] = useState('');
    const [user, setUser] = useState();
    console.log("usersssss", user);

    const socketRef = useRef();

    const Users = async () => {
        const token = await AsyncStorage.getItem('TOKEN')
        socketRef.current = io.connect('http://159.203.8.120:3001', {
            query: { token },
            // transports: ['websocket']
        });

        socketRef.current.on("profile", id => {
            console.log("id", id)
            const conne = { profileId: id.id }
            const para = {
                communityId: '12345',
                profileId: id.id
            }
            socketRef.current.emit('myProfileId', conne)
            socketRef.current.emit('join community', para)
            setYourID(id.id);
        })

        // socketRef.current.on('myProfileId', ({ profileId }) => {
        //     socket.join(profileId);
        // });

        // For Search Engine
        socketRef.current.on("user list", (name) => {
            console.log("UserList Name", name);
            setUser(name)
        });

        const pass = { name: text }
        socketRef.current.emit('user list', pass)

    }

    useEffect(() => {
        Users()
    }, [text]);


    return (
        <View style={styles.Container}>
            <View style={{ paddingTop: 60, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <TextInput
                    style={styles.textinput}
                    placeholder="Search User"
                    onChangeText={(text) => setText(text)}
                />
            </View>
            <View>
                <FlatList
                    data={user}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => {
                            navigation.navigate("NewChat", { Id: user })
                        }}
                            style={{
                                borderWidth: 1, borderColor: 'black', margin: 5, borderRadius: 10,
                                height: 40, justifyContent: 'center', width: 100, alignItems: 'center'
                            }}>
                            <Text>
                                {item.username}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    )
}

export default UserList;

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textinput: {
        backgroundColor: 'grey',
        height: 40,
        width: '90%',
        borderRadius: 10,
        fontSize: 16,
        color: 'white'
    }
})