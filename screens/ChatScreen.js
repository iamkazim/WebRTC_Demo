import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-community/async-storage';
import { TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Modal from 'react-native-modal';
import { GiftedChat } from 'react-native-gifted-chat';
// import io from "socket.io-client";
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    MediaStream,
    MediaStreamTrack,
    mediaDevices,
    registerGlobals,
} from 'react-native-webrtc';

const STUN_SERVER = 'stun:webrtc.skyrockets.space:3478';
const SOCKET_URL = 'http://159.203.8.120:3001';

export default function ChatScreen({ navigation, ...props }) {
    const [userId, setUserId] = useState('');
    const [socketActive, setSocketActive] = useState(false);
    const [calling, setCalling] = useState(false);
    const [localStream, setLocalStream] = useState({ toURL: () => null });
    const [remoteStream, setRemoteStream] = useState({ toURL: () => null });
    const [messages, setMessages] = useState([]); // Chats between the peers will be stored here
    console.log("Chat Messege", messages);

    // const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhY2hpbi50YWxtYWxlLjU1MTgzMkBnbWFpbC5jb20iLCJpYXQiOjE2NDU2MTg5NDYsImV4cCI6MTY0NTYyMjU0Nn0.4T_Q2Fc2F_Lmxfr6lSyQzRHzgS7sMxKn4ok_rZk3Z3I'

    // const conn = useRef(new WebSocket(SOCKET_URL, null, {
    //     headers: {
    //         token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhY2hpbi50YWxtYWxlLjU1MTgzMkBnbWFpbC5jb20iLCJpYXQiOjE2NDU2ODc4NTgsImV4cCI6MTY0NTY5MTQ1OH0.uz2l-W_bxZDEypmLnALCTKWygB6LGwNu1RX5R0zsoGs'
    //     }
    // }));
    const conn = useRef(new WebSocket(SOCKET_URL));
    // const conn = useRef(io.connect(SOCKET_URL));
    // const io = socketIo(SOCKET_URL)
    // console.log('io response', io);

    const yourConn = useRef(
        new RTCPeerConnection({
            iceServers: [
                {
                    urls: STUN_SERVER,
                },
            ],
        }),
    );

    const [callActive, setCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [otherId, setOtherId] = useState('');
    const [callToUsername, setCallToUsername] = useState('');
    const connectedUser = useRef(null);
    const offerRef = useRef(null);
    const sendChannel = useRef();

    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem('userId').then((id) => {
                console.log(id);
                if (id) {
                    setUserId(id);
                } else {
                    setUserId('');
                    navigation.push('Login');
                }
            });
        }, [userId]),
    );

    useEffect(() => {
        navigation.setOptions({
            title: 'Your ID - ' + userId,
            headerRight: () => (
                <Button mode="text" onPress={onLogout} style={{ paddingRight: 10 }}>
                    Logout
                </Button>
            ),
        });
    }, [userId]);

    /**
     * Calling Stuff
     */

    useEffect(() => {
        if (socketActive && userId.length > 0) {
            try {
                // InCallManager.start({media: 'audio'});
                // InCallManager.setForceSpeakerphoneOn(true);
                // InCallManager.setSpeakerphoneOn(true);
            } catch (err) {
                console.log('InApp Caller ---------------------->', err);
            }

            send({
                type: 'login',
                name: userId,
            });
        }
    }, [socketActive, userId]);

    const handleProfile = async (profile) => {
        console.log("PROFILE", profile)
    }

    const onLogin = () => { };

    useEffect(() => {
        /**
         *
         * Sockets Signalling
         */
        conn.current.onopen = () => {
            console.log('Connected to the signaling server');
            setSocketActive(true);
        };
        //when we got a message from a signaling server
        conn.current.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            console.log('Data --------------------->', data);
            switch (data.type) {
                case 'profile':
                    handleProfile(data.profile)
                    console.log('Profile');
                    break;
                case 'login':
                    console.log('Login');
                    break;
                //when somebody wants to call us
                case 'offer':
                    handleOffer(data.offer, data.name);
                    console.log('Offer');
                    break;
                case 'answer':
                    handleAnswer(data.answer);
                    console.log('Answer');
                    break;
                //when a remote peer sends an ice candidate to us
                case 'candidate':
                    handleCandidate(data.candidate);
                    console.log('Candidate');
                    break;
                case 'leave':
                    handleLeave();
                    console.log('Leave');
                    break;
                default:
                    break;
            }
        };
        conn.current.onerror = function (err) {
            console.log('Got error', err);
        };
        initLocalVideo();
        registerPeerEvents();
    }, []);

    useEffect(() => {
        if (!callActive) {
            // InCallManager.stop();
        } else {
            // InCallManager.setSpeakerphoneOn(true);
        }
    }, [callActive]);

    const registerPeerEvents = () => {
        yourConn.current.onaddstream = (event) => {
            console.log('On Add Remote Stream');
            setRemoteStream(event.stream);
        };

        // Setup ice handling
        yourConn.current.onicecandidate = (event) => {
            if (event.candidate) {
                send({
                    type: 'candidate',
                    candidate: event.candidate,
                });
            }
        };
    };

    const initLocalVideo = () => {
        // let isFront = false;
        // mediaDevices.enumerateDevices().then(sourceInfos => {
        //   let videoSourceId;
        //   for (let i = 0; i < sourceInfos.length; i++) {
        //     const sourceInfo = sourceInfos[i];
        //     if (
        //       sourceInfo.kind == 'videoinput' &&
        //       sourceInfo.facing == (isFront ? 'front' : 'environment')
        //     ) {
        //       videoSourceId = sourceInfo.deviceId;
        //     }
        //   }
        mediaDevices
            .getUserMedia({
                audio: true,
                video: {
                    mandatory: {
                        minWidth: 500, // Provide your own width, height and frame rate here
                        minHeight: 300,
                        minFrameRate: 30,
                    },
                    facingMode: 'user',
                    // optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
                },
            })
            .then((stream) => {
                // Got stream!
                setLocalStream(stream);

                // setup stream listening
                yourConn.current.addStream(stream);
            })
            .catch((error) => {
                // Log error
            });
        // });
    };

    const send = (message) => {
        //attach the other peer username to our messages
        if (connectedUser.current) {
            message.name = connectedUser.current;
            // console.log('Connected iser in end----------', message);
        }
        console.log('Message', message);
        conn.current.send(JSON.stringify(message));
    };

    const onCall = () => {
        sendCall(callToUsername);
        setTimeout(() => {
            sendCall(callToUsername);
        }, 1000);
    };

    const sendCall = (receiverId) => {
        setCalling(true);
        const otherUser = receiverId;
        connectedUser.current = otherUser;
        console.log('Caling to', otherUser);

        // create an offer
        yourConn.current.createOffer().then((offer) => {
            yourConn.current.setLocalDescription(offer).then(() => {
                console.log('Sending Ofer');

                sendChannel.current = yourConn.current.createDataChannel("sendChannel");
                sendChannel.current.onmessage = handleReceiveMessage;
                // console.log(offer);
                send({
                    type: 'offer',
                    offer: offer,
                });
                // Send pc.localDescription to peer

            });
        });
    };

    //when somebody sends us an offer
    const handleOffer = async (offer, name) => {
        console.log(name + ' is calling you.');
        connectedUser.current = name;
        offerRef.current = { name, offer };
        setIncomingCall(true);
        setOtherId(name);

        yourConn.current.ondatachannel = (event) => {
            sendChannel.current = event.channel;
            console.log("EVENT", event.channel);
            // console.log("currentChannel", send.current.channel);
            sendChannel.current.onmessage = handleReceiveMessage;
            console.log('[SUCCESS] Connection established')
        }
        // acceptCall();
        if (callActive) acceptCall();
    };

    const acceptCall = async () => {
        const name = offerRef.current.name;
        const offer = offerRef.current.offer;
        setIncomingCall(false);
        setCallActive(true);
        console.log('Accepting CALL', name, offer);
        yourConn.current
            .setRemoteDescription(offer)
            .then(function () {
                connectedUser.current = name;
                return yourConn.current.createAnswer();
            })
            .then(function (answer) {
                yourConn.current.setLocalDescription(answer);
                send({
                    type: 'answer',
                    answer: answer,
                });
            })
            .then(function () {
                // Send the answer to the remote peer using the signaling server
            })
            .catch((err) => {
                console.log('Error acessing camera', err);
            });

        // try {
        //   await yourConn.setRemoteDescription(new RTCSessionDescription(offer));

        //   const answer = await yourConn.createAnswer();

        //   await yourConn.setLocalDescription(answer);
        //   send({
        //     type: 'answer',
        //     answer: answer,
        //   });
        // } catch (err) {
        //   console.log('Offerr Error', err);
        // }
    };

    //when we got an answer from a remote user
    const handleAnswer = (answer) => {
        setCalling(false);
        setCallActive(true);
        yourConn.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    // Here we are implemeting chat messege part
    function handleReceiveMessage(name) {
        // Listener for receiving messages from the peer
        console.log("[INFO] Message received from peer", name.data);
        const msg = [{
            _id: Math.random(1000).toString(),
            text: name.data,
            createdAt: new Date(),
            user: {
                _id: 2,
                name: 'kazim'
            },
        }];
        setMessages(previousMessages => GiftedChat.append(previousMessages, msg))
    };

    function sendMessage(messages = []) {
        console.log("Messeges", messages);
        sendChannel.current.send(messages[0].text);
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
    }

    //when we got an ice candidate from a remote user
    const handleCandidate = (candidate) => {
        setCalling(false);
        console.log('Candidate ----------------->', candidate);
        yourConn.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    //hang up
    // const hangUp = () => {
    //   send({
    //     type: 'leave',
    //   });

    //   handleLeave();
    // };

    // const handleLeave = () => {
    //   connectedUser.current = null;
    //   setRemoteStream({toURL: () => null});

    //   // yourConn.close();
    //   // yourConn.onicecandidate = null;
    //   // yourConn.onaddstream = null;
    // };

    const onLogout = () => {
        // hangUp();

        handleLeave();

        AsyncStorage.removeItem('userId').then((res) => {
            navigation.push('Login');
        });
    };

    const rejectCall = async () => {
        send({
            type: 'leave',
        });
        // ``;
        // setOffer(null);

        // handleLeave();
    };

    const handleLeave = () => {
        send({
            name: userId,
            otherName: otherId,
            type: 'leave',
        });

        setCalling(false);
        setIncomingCall(false);
        setCallActive(false);
        offerRef.current = null;
        connectedUser.current = null;
        setRemoteStream(null);
        setLocalStream(null);
        yourConn.current.onicecandidate = null;
        yourConn.current.ontrack = null;

        resetPeer();
        initLocalVideo();
        // console.log("Onleave");
    };

    const resetPeer = () => {
        yourConn.current = new RTCPeerConnection({
            iceServers: [
                {
                    urls: STUN_SERVER,
                },
            ],
        });

        registerPeerEvents();
    };

    /**
     * Calling Stuff Ends
     */

    return (
        <View style={styles.root}>
            <View style={styles.inputField}>
                <TextInput
                    label="Enter Friends Id"
                    mode="outlined"
                    style={{ marginBottom: 7 }}
                    onChangeText={(text) => setCallToUsername(text)}
                />
                <Text>
                    SOCKET ACTIVE:{socketActive ? 'TRUE' : 'FASLE'}, FRIEND ID:
                    {callToUsername || otherId}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    <Button
                        mode="contained"
                        onPress={onCall}
                        loading={calling}
                        contentStyle={styles.btnContent}
                        disabled={!socketActive || callToUsername === '' || callActive}>
                        Connect
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleLeave}
                        contentStyle={styles.btnContent}
                        disabled={!callActive}>
                        Disconnect
                    </Button>
                </View>

                <Button
                    mode="contained"
                    onPress={handleProfile}
                    contentStyle={styles.btnContent}>
                    Profile Check
                </Button>
            </View>
            <GiftedChat
                messages={messages}
                onSend={messages => sendMessage(messages)}
                user={{
                    _id: 1,
                }}
            />

            <Modal isVisible={incomingCall && !callActive}>
                <View
                    style={{
                        backgroundColor: 'white',
                        padding: 22,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 4,
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                    }}>
                    <Text>{otherId + ' is calling you'}</Text>

                    <Button onPress={acceptCall}>Accept Request</Button>
                    <Button title="Reject Call" onPress={handleLeave}>
                        Reject Request
                    </Button>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: '#fff',
        flex: 1,
        padding: 20,
    },
    inputField: {
        marginBottom: 10,
        flexDirection: 'column',
    },
});
