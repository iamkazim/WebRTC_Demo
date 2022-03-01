import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import io from "socket.io-client";
import AsyncStorage from '@react-native-community/async-storage';
// import { useFocusEffect } from '@react-navigation/native';
// import { Chats } from '../Data/DummyData';

const NewChatScreen = ({ route, navigation }) => {
    const [yourID, setYourID] = useState();
    const [token, setToken] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [file, setFile] = useState();
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

    function UserlistShow() {
        const pass = { name: 'sa' }
        socketRef.current.emit('user list', pass)
    }

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

    function selectFile(e) {
        setMessage(e.target.files[0].name);
        setFile(e.target.files[0]);
    }

    function renderMessages(message, index) {
        console.log("+++++", message);
        if (message.type === "file") {
            const blob = new Blob([message.body], { type: message.type });
            if (message.id === yourID) {
                return (
                    <MyRow key={index}>
                        {/* <Image fileName={message.fileName} blob={blob} /> */}
                    </MyRow>
                )
            }
            return (
                <PartnerRow key={index}>
                    {/* <Image fileName={message.fileName} blob={blob} /> */}
                </PartnerRow>
            )
        }

        if (message.id === yourID) {
            return (
                <MyRow key={index}>
                    <MyMessage>
                        {message.body}
                    </MyMessage>
                </MyRow>
            )
        }
        return (
            <PartnerRow key={index}>
                <PartnerMessage>
                    {message.body}
                </PartnerMessage>
            </PartnerRow>
        )
    }

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

                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <TouchableOpacity onPress={sendMessage}
                        style={{
                            height: 40, width: 90, backgroundColor: 'skyblue',
                            justifyContent: 'center', alignItems: 'center', borderRadius: 15
                        }}>
                        <Text style={{ fontWeight: 'bold' }}>Send</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={UserlistShow}
                        style={{
                            height: 40, width: 90, backgroundColor: 'skyblue',
                            justifyContent: 'center', alignItems: 'center', borderRadius: 15
                        }}>
                        <Text style={{ fontWeight: 'bold' }}>Users List</Text>
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
