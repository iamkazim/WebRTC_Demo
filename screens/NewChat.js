import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, PermissionsAndroid, Alert, Image } from "react-native";
import io from "socket.io-client";
import AsyncStorage from '@react-native-community/async-storage';
import DocumentPicker from 'react-native-document-picker';
import { Buffer } from "buffer";
global.Buffer = Buffer;
import ImgToBase64 from 'react-native-image-base64';
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

    // const output = file.map(user => {
    //     console.log('^^^^', user);
    //     console.log(output);
    // })

    // var str = Object.keys(file).map(function (key) {
    //     return "" + key + "=" + data[key]; // line break for wrapping only
    // }).join("&");
    // console.log(str);

    const chooseFile = async () => {
        // Opening Document Picker to select one file
        try {
            const res = await DocumentPicker.pick({
                // Provide which type of file you want user to pick
                type: [DocumentPicker.types.images],
                // There can me more options as well
                // DocumentPicker.types.allFiles
                // DocumentPicker.types.images
                // DocumentPicker.types.plainText
                // DocumentPicker.types.audio
                // DocumentPicker.types.pdf
            });
            // Printing the log realted to the file
            console.log('res : ' + JSON.stringify(res));
            // ImgToBase64.getBase64String(res[0])
            //     .then(async (base64String) => {
            //         let source = "data:image/jpeg;base64," + base64String;
            //         console.log("base64", source);
            //     })
            // Setting the state to show single file attributes
            setFile(res[0]);
            //setFilePath(res)
        } catch (err) {
            setFile(null);
            // Handling any exception (If any)
            if (DocumentPicker.isCancel(err)) {
                // If user canceled the document selection
                //alert('Canceled');
            } else {
                // For Unknown Error
                // alert('Unknown Error: ' + JSON.stringify(err));
                throw err;
            }
        }
    }
    console.log('file', file)
    console.log("type", file.type);
    const buf = Buffer.from(JSON.stringify(file));
    console.log("BuFF", buf);
    var temp = JSON.parse(buf.toString());
    console.log("Converted", temp);

    // const buf = Buffer.from()
    // const bufferForm = Buffer.from('file', 'utf-8');
    // console.log("buffer", bufferForm)
    // const buffer = Buffer.from(file, 'base64')
    // console.log("Buffer", buffer);
    // fs.readFile(file, function (err, buffer) {
    //     console.log(buffer);
    // })

    function sendMessage(e) {
        e.preventDefault();
        // if (file) {
        //     var receiverProfileId;
        //     if (yourID == yourID) {
        //         receiverProfileId = Ids
        //     }
        //     else {
        //         receiverProfileId = yourID
        //     }
        //     const messageObject = {
        //         id: yourID,
        //         senderProfileId: yourID,
        //         receiverProfileId: receiverProfileId,
        //         type: "file",
        //         body: '<Buffer 66 69 6c 65>',
        //         mimeType: file?.type,
        //         fileName: file?.name
        //     };
        //     setMessage("");
        //     setFile();
        //     socketRef.current.emit("send message", messageObject);
        // } else {
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
    // }
    function selectFile(e) {
        setMessage(e.target.files[0].name);
        setFile(e.target.files[0]);
    }

    function handleChange(text) {
        setMessage(text);
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
    };

    // const chooseFile = async () => {
    //     try {
    //         const granted = await PermissionsAndroid.request(
    //             PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    //             {
    //                 title: 'Demo Storage Permission',
    //                 message:
    //                     'Demo App needs access to your storage to download Photos.',
    //             },
    //         );
    //         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //             const image = await DocumentPicker.pick({
    //                 type: [DocumentPicker.types.allFiles],
    //             });
    //             // console.log('Image@@ : ' + JSON.stringify(image[0]));
    //             setFile(JSON.stringify(image[0]))
    //             console.log("File", file);
    //         } else {
    //             Alert.alert('Storage Permission Not Granted');
    //         }
    //     } catch (err) {
    //         console.warn(err);
    //     }
    // };


    const renderFile = () => {
        return (
            <View>
                {/* <TextInput type='file' onChange={selectFile} /> */}
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
