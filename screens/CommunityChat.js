import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity } from "react-native";
import io from "socket.io-client";
import AsyncStorage from '@react-native-community/async-storage';

const CommunityChatScreen = ({ route, navigation }) => {
    const [yourID, setYourID] = useState();
    const [token, setToken] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [file, setFile] = useState();
    console.log("all messages", messages);
    const Ids = route?.params?.Id[0]?.profileId
    console.log(Ids);

    const socketRef = useRef();

    const CommunityConnect = async () => {
        const token = await AsyncStorage.getItem('TOKEN')
        if (token) {
            setToken(token)
        }
        else {
            setToken('')
            navigation.push('Login')
        }
        socketRef.current = io.connect('http://159.203.8.120:3001', {
            query: { token }
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

        socketRef.current.on('myProfileId', ({ profileId }) => {
            socket.join(profileId);
        });

        socketRef.current.on("community chat", (message) => {
            console.log("________", message);
            receivedMessage(message);
        });
    }
    useEffect(() => {
        CommunityConnect()
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Your ID - ' + yourID,
        });
    }, [yourID]);

    function receivedMessage(message) {
        setMessages(oldMsgs => [...oldMsgs, message]);
    }

    function sendMessage(e) {
        e.preventDefault();
        if (file) {
            const messageObject = {
                id: yourID,
                senderProfileId: "620110b40eaa0f19b9122159",
                receiverProfileId: "6201008d109a22560ef31a6f",
                type: "file",
                body: file,
                mimeType: file.type,
                fileName: file.name
            };
            setMessage("");
            setFile();
            socketRef.current.emit("send message", messageObject);
        } else {
            var receiverProfileId;
            if (yourID == yourID) {
                receiverProfileId = Ids
            }
            else {
                receiverProfileId = yourID
            }
            const messageObject = {
                communityId: '12345',
                profileId: yourID,
                message: message,
            };
            setMessage("");
            socketRef.current.emit("community chat", messageObject);
        }
    }

    function handleChange(text) {
        setMessage(text);
    }

    const renderMessagesItem = ({ item }) => {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <View style={{
                    width: '80%', margin: 5, alignSelf: item.profileId === yourID ? 'flex-start' : 'flex-end',
                    borderRadius: 12, justifyContent: 'center', backgroundColor: item.profileId != yourID ? 'lightgrey' : 'cyan'
                }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', margin: 10 }}>
                        {item.message}
                    </Text>
                </View>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, padding: 10, backgroundColor: '#FFFFFF' }}>
            <FlatList
                data={messages}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderMessagesItem} />
            <View>
                <TextInput
                    style={{ borderWidth: 1, borderColor: 'black', margin: 5, borderRadius: 15 }}
                    placeholder="Messege here"
                    value={message}
                    onChangeText={handleChange} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <TouchableOpacity onPress={sendMessage}
                        style={{
                            height: 40, width: 90, backgroundColor: 'skyblue',
                            justifyContent: 'center', alignItems: 'center', borderRadius: 15
                        }}>
                        <Text style={{ fontWeight: 'bold' }}>Send</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity onPress={UserlistShow}
                        style={{
                            height: 40, width: 90, backgroundColor: 'skyblue',
                            justifyContent: 'center', alignItems: 'center', borderRadius: 15
                        }}>
                        <Text style={{ fontWeight: 'bold' }}>Users List</Text>
                    </TouchableOpacity> */}
                </View>
            </View>

        </View>
    );
};

export default CommunityChatScreen;