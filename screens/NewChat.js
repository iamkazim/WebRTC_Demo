import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, PermissionsAndroid, Alert, Image } from "react-native";
import io from "socket.io-client";
import AsyncStorage from '@react-native-community/async-storage';
import DocumentPicker from 'react-native-document-picker';
import { Buffer } from "buffer";
global.Buffer = Buffer;
// import ImgToBase64 from 'react-native-image-base64';
// import { useFocusEffect } from '@react-navigation/native';
// import { Chats } from '../Data/DummyData';

const NewChatScreen = ({ route, navigation }) => {
    const [yourID, setYourID] = useState();
    const [token, setToken] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [file, setFile] = useState({});
    console.log("all messages", messages);
    const Ids = route?.params?.Id[0]?.profileId
    console.log(Ids);

    const socketRef = useRef();

    const connecting = async () => {
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
            socketRef.current.emit('myProfileId', conne)
            setYourID(id.id);
        })

        socketRef.current.on('myProfileId', ({ profileId }) => {
            socket.join(profileId);
        });

        // For Search Engine
        socketRef.current.on("user list", (name) => {
            console.log("UserList Name", name);
        })
        // **// 

        socketRef.current.on("receive message", (message) => {
            console.log("________", message);
            receivedMessage(message);
        });
    };

    useEffect(() => {
        connecting()
    }, [])

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
            var receiverProfileId;
            if (yourID == yourID) {
                receiverProfileId = Ids
            }
            else {
                receiverProfileId = yourID
            }
            const messageObject = {
                id: yourID,
                senderProfileId: yourID,
                receiverProfileId: receiverProfileId,
                type: "file",
                file: file,
                mimeType: file?.type,
                fileName: file?.name
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
                senderProfileId: yourID,
                receiverProfileId: receiverProfileId,
                message: message,
                id: yourID,
            };
            setMessage("");
            socketRef.current.emit("send message", messageObject);
        }
    }

    function handleChange(text) {
        setMessage(text);
    }

    const chooseFile = async () => {
        try {
            const res = await DocumentPicker.pick({
                type: [DocumentPicker.types.images],
            });
            console.log('res : ' + JSON.stringify(res));
            setFile(res[0]);
        } catch (err) {
            setFile(null);
            if (DocumentPicker.isCancel(err)) {
            } else {
                throw err;
            }
        }
    }

    const renderFile = () => {
        return (
            <View>
                <Image
                    source={{ uri: file.uri }}
                    style={{ width: 80, height: 90 }} />
            </View>
        )
    };

    const renderMessagesItem = ({ item }) => {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <View style={{
                    width: '80%', margin: 5, alignSelf: item.senderProfileId === yourID ? 'flex-start' : 'flex-end',
                    borderRadius: 12, justifyContent: 'center', backgroundColor: item.senderProfileId != yourID ? 'lightgrey' : 'cyan'
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
                {file ? renderFile() : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <TouchableOpacity onPress={sendMessage}
                        style={{
                            height: 40, width: 90, backgroundColor: 'skyblue',
                            justifyContent: 'center', alignItems: 'center', borderRadius: 15
                        }}>
                        <Text style={{ fontWeight: 'bold' }}> Send</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={chooseFile}
                        style={{
                            height: 40, width: 90, backgroundColor: 'skyblue',
                            justifyContent: 'center', alignItems: 'center', borderRadius: 15
                        }}>
                        <Text style={{ fontWeight: 'bold' }}>Choose File</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </View>
        // <Page>
        //     <Container>
        //         {messages.map(renderMessages)}
        //     </Container>
        //     <Form onSubmit={sendMessage}>
        //         <TextArea value={message} onChange={handleChange} placeholder="Say something..." />
        //         <input onChange={selectFile} type="file" />
        //         <Button>Send</Button>
        //     </Form>
        // </Page>
    );
};

const styles = StyleSheet.create({
    btn: {
        height: 60,
        alignItems: 'stretch',
        justifyContent: 'center',
        fontSize: 18,
    },
    btnContent: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
})

export default NewChatScreen;
