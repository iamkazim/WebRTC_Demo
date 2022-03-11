import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Image, PermissionsAndroid, Alert } from "react-native";
import io from "socket.io-client";
import AsyncStorage from '@react-native-community/async-storage';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { launchImageLibrary } from 'react-native-image-picker';

const NewChatScreen = ({ route, navigation }) => {
    const [yourID, setYourID] = useState();
    const [token, setToken] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [file, setFile] = useState();
    const [imageCon, setImageCon] = useState();
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
            query: { token },
        });

        socketRef.current.on("profile", id => {
            console.log("id", id)
            const conne = { profileId: id.id }
            console.log("connnn", conne);
            socketRef.current.emit('myProfileId', conne)
            setYourID(id.id);
        })

        // socketRef.current.on('myProfileId', ({ profileId }) => {
        //     socket.join(profileId);
        // });

        // For Search Engine
        socketRef.current.on("user list", (name) => {
            console.log("UserList Name", name);
        })
        // **// 

        socketRef.current.on("receive message", (message) => {
            // console.log("________", message);
            receivedMessage(message);
        });
    };

    useEffect(() => {
        connecting()
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Your ID - ' + yourID,
        });
    }, [yourID]);

    function receivedMessage(message) {
        setMessages(oldMsgs => [...oldMsgs, message]);
    }


    const imageGalleryLaunch = () => {
        let options = {
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };
        launchImageLibrary(options, (res) => {
            console.log('Response = ', res);
            if (res.didCancel) {
                console.log('User cancelled image picker');
            } else if (res.error) {
                console.log('ImagePicker Error: ', res.error);
            } else if (res.customButton) {
                console.log('User tapped custom button: ', res.customButton);
                alert(res.customButton);
            } else {
                const source = { uri: res.uri };
                console.log('response', JSON.stringify(res));

                for (var i = 0; i < res.assets.length; i++) {
                    console.log('data', res.assets[i]);
                    //Do something
                    console.log('base64 -> ', res.assets[i].base64);
                    console.log('uri -> ', res.assets[i].uri);
                    console.log('width -> ', res.assets[i].width);
                    console.log('height -> ', res.assets[i].height);
                    console.log('fileSize -> ', res.assets[i].fileSize);
                    console.log('type -> ', res.assets[i].type);
                    console.log('fileName -> ', res.assets[i].fileName);

                    setFile(res.assets[i]);
                }
            }
        });
    }

    // const chooseFile = async () => {
    //     try {
    //         const granted = await PermissionsAndroid.request(
    //             PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    //             {
    //                 title: 'webSocket Storage Permission',
    //                 message:
    //                     'webSocket App needs access to your storage to download Photos.',
    //             },
    //         );
    //         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //             const image = await DocumentPicker.pick({
    //                 type: [DocumentPicker.types.allFiles],
    //             });
    //             setFile(image[0])
    //             console.log('filepath', file);
    //         } else {
    //             Alert.alert('Storage Permission Not Granted');
    //         }
    //     } catch (err) {
    //         console.warn(err);
    //     }
    // }

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
            RNFS.readFile(file?.uri, 'base64').then(res => {
                setImageCon(res);
            })
            // console.log("response", imageCon);
            const messageObject = {
                id: yourID,
                senderProfileId: yourID,
                receiverProfileId: receiverProfileId,
                type: "file",
                file: imageCon,
                mimeType: file?.type,
                fileName: file?.fileName
            };
            socketRef.current.emit("send message", messageObject);
            console.log("Object", messageObject);
            setMessage("");
            setFile();
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
                    {item.file ?
                        <Image source={{ uri: item.imageUrl }} style={{ width: 90, height: 90 }} /> : null}
                </View>
            </View>
        )
    }

    const renderFile = () => {
        return (
            <View>
                <Image
                    source={{ uri: file?.uri }}
                    style={{ width: 80, height: 90 }} />
            </View>
        )
    };

    return (
        <View style={{ flex: 1, padding: 10, backgroundColor: '#FFFFFF' }}>
            <FlatList
                data={messages}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderMessagesItem} />
            <View>
                {file ? renderFile() :
                    <TextInput
                        style={{ borderWidth: 1, borderColor: 'black', margin: 5, borderRadius: 15 }}
                        placeholder="Messege here"
                        value={message}
                        onChangeText={handleChange} />
                }

                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <TouchableOpacity onPress={sendMessage}
                        style={{
                            height: 40, width: 90, backgroundColor: 'skyblue',
                            justifyContent: 'center', alignItems: 'center', borderRadius: 15
                        }}>
                        <Text style={{ fontWeight: 'bold' }}> Send</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={imageGalleryLaunch}
                        style={{
                            height: 40, width: 90, backgroundColor: 'skyblue',
                            justifyContent: 'center', alignItems: 'center', borderRadius: 15
                        }}>
                        <Text style={{ fontWeight: 'bold' }}>Choose File</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </View>
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
