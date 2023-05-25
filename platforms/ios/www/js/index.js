document.addEventListener("deviceready", onDeviceReady, false);

// Mockup testing on browser
if (!window.cordova) {
	window.cordova = {
		plugins: {
			CordovaCall: {
				on: function() {},
				endCall: function() {}
			}
		}
	};
	window.VoIPPushNotification  = {init: function() {
		return {
			on: function() {}
		};
	}};
	window.VoIPLocalServer = function() {
		return {
			lookupLocalIP: function() {}
		};
	};
	onDeviceReady();
}

document.getElementById("endcall").onclick = function () {
	cordova.plugins.CordovaCall.endCall();
};

// Test notification open imcoming call
document.getElementById("notification").onclick = function () {
	var payload = {
		Caller: {
			Username: "Alex",
			ConnectionId: "Alex123",
			data: {
				key: "anything data here",
			},
		},
	};
	cordova.plugins.CordovaCall.notification(payload);
};

function onDeviceReady() {
	// Cordova Call events
	cordova.plugins.CordovaCall.on("answer", function (e) {
		logMessage("Answer:" + JSON.stringify(e));
		onCordovaCallAnswer(e);
	});
	cordova.plugins.CordovaCall.on("reject", function (e) {
		logMessage("Reject: " + JSON.stringify(e));

		// Send reject to caller
		voIPServer.reject({
			ip: e.callName,
		});
	});

	// Foreground, background event
	document.addEventListener(
		"appEnterForeground",
		function () {
			logMessage("App foreground");
		},
		false
	);
	document.addEventListener(
		"appEnterBackground",
		function () {
			logMessage("App background");
		},
		false
	);

	// Puskit IOS event
	var push = VoIPPushNotification.init();
	push.on("registration", function (data) {
		logMessage("Registration: " + data.deviceToken);
	});
	push.on("notification", function (data) {
		logMessage("Notification: " + JSON.stringify(data));
	});

	// VoIP Local IP Call without Server
	var voIPServer = new VoIPLocalServer();
	var localIp = "";
	var groupCallData;
	var localMeeting;

	// Lookup my ip
	voIPServer.lookupLocalIP(function (ip) {
		localIp = ip;
		document.getElementById("ip").innerHTML = localIp;
	});

	// Call button
	document.getElementById("call-ip").onclick = function () {
		var receiverIp = document.getElementById("receiver-ip").value;
		voIPServer.sendCall(
			{
				ip: receiverIp,
				caller: localIp || "Unknow IP",
			},
			function (status, err) {
				if (err) {
					logMessage(
						"[VoIPLocalServer] Send call to " + receiverIp + " unsuccessful " + err.toString()
					);
				} else {
					logMessage(
						"[VoIPLocalServer] Send call to " + receiverIp + " successful"
					);
				}
			}
		);
	};
	document.getElementById("call-stop").onclick = stopVideoCall;

	voIPServer.onGroupCall = function (payload, err) {
		if (!err) {
			groupCallData = payload;
			cordova.plugins.CordovaCall.receiveCall(payload.fromIp || "Unknow IP");
		}
	};

	voIPServer.onReceiveCall = function (payload, err) {
		if (!err) {
			groupCallData = null;
			cordova.plugins.CordovaCall.receiveCall(payload.fromIp || "Unknow IP");
		} else {
			logMessage("[VoIPLocalServer] receiveCall erro: " + e.toString());
		}
	};

	voIPServer.onAnswer = function (payload) {
		logMessage("[VoIPLocalServer] answer: " + JSON.stringify(payload));

		// Open video call
		startVideoCall(payload.fromIp);
	};

	voIPServer.onReject = function (payload) {
		logMessage("[VoIPLocalServer] reject: " + JSON.stringify(payload));
	};

	voIPServer.onMessage = function (payload) {
		console.log("[VoIPLocalServer] message: ", payload);
		rtcMessageHandler(payload);
	};

	// Webrtc session
	var localVideo = document.getElementById("localVideo");
	var rtcActions = {
		sendSDP: "sendSDP",
		answerSDP: "answerSDP",
		icecandidate: "icecandidate",
		endCall: "endCall",
		joinCall: "joinCall",
	};
    var vgaConstraints = {
        video: {width: {exact: 640}, height: {exact: 480}},
        audio: true
    };      
	var offerOptions = {
		offerToReceiveAudio: 1,
		offerToReceiveVideo: 1,
	};
	var icecandidates = {};
	var localStream;
	var peers = []; // Peers connected
	window.peers = peers; // Expose for debug


	function onCordovaCallAnswer(data) {
		// Group call Android Box - Cordova
		if (groupCallData) {
			startLocalMeeting(groupCallData.uri);
			return;
		}
		// Direct call Cordova - Cordova
		closeLocalMeeting();
		voIPServer.answer({
			ip: data.callName,
		});
	}

	function startLocalMeeting(meetingWsUri) {
		closeLocalMeeting();
		localMeeting = new LocalMeeting(encodeURI(meetingWsUri));
		localMeeting.onMessage = rtcMessageHandler;
		localMeeting.onClose = stopVideoCall;
	}
	window.startLocalMeeting = startLocalMeeting;

	function startVideoCall(peerIp) {
		initVideoCall(peerIp, initLocalSDP);
	}

	function stopVideoCall() {
		stopLocalStream();
		peers.forEach((peer) => {
			peer.close();
			peer.remoteVideo.remove();
			sendRtcMessage(rtcActions.endCall, peer.peerIp);
		});
		peers.length = 0;
		closeLocalMeeting();
	}

	function stopLocalStream() {
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
			localStream = null;
		}
		cordova.plugins.CordovaCall.endCall();
	}

	function stopRtcPeer(peerIp) {
		removeRTCPeer(peerIp);
		if (peers.length < 1) {
			stopLocalStream();
		}
	}

	function initVideoCall(peerIp, callback) {
		if (!window.device) {
			return requestLocalVideo(peerIp, callback);
		}
		if (device.platform === "Android") {
			requestPermission(function (data, err) {
				if (err) {
					console.error(err);
				}
				requestLocalVideo(peerIp, callback);
			});
		} else {
			// IOS
			cordova.plugins.iosrtc.registerGlobals();
			requestLocalVideo(peerIp, callback);
		}
	}

	function requestPermission(callback) {
		var permissions = cordova.plugins.permissions;
		permissions.requestPermissions(
			[permissions.CAMERA, permissions.RECORD_AUDIO],
			function (status) {
				if (status.hasPermission) {
					callback(true);
				} else {
					callback(false, "Permission not grant");
				}
			},
			function (e) {
				callback(false, e);
			}
		);
	}

	function requestLocalVideo(peerIp, callback) {
		if (localStream) {
			return callback(initRTCPeer(peerIp));
		}
		try {
			navigator.mediaDevices
				.getUserMedia(vgaConstraints)
				.then(function (stream) {
					localVideo.srcObject = stream;
					localVideo.play();
					localStream = stream;
					callback(initRTCPeer(peerIp));
				});
		} catch (e) {
			alert("getUserMedia() error: " + e.name);
		}
	}

	function initRTCPeer(peerIp) {
		var rtcPeer = new RTCPeerConnection({});
		rtcPeer.peerIp = peerIp;
		rtcPeer.remoteVideo = createVideoTag();
		rtcPeer.addEventListener("icecandidate", onIceCandidate.bind(rtcPeer));
		rtcPeer.addEventListener(
			"iceconnectionstatechange",
			onIceStateChange.bind(rtcPeer)
		);
		rtcPeer.addEventListener(
			"connectionstatechange",
			onConnectionStateChange.bind(rtcPeer)
		);
		rtcPeer.addEventListener(
			"signalingstatechange",
			onSignalingStateChange.bind(rtcPeer)
		);
		rtcPeer.addEventListener("track", gotRemoteStream.bind(rtcPeer));
        rtcPeer._iceConnectionStates = [];
        rtcPeer._connectionStates = [];
        rtcPeer._signalingStates = [];
        onIceStateChange.call(rtcPeer);
        onConnectionStateChange.call(rtcPeer);
        onSignalingStateChange.call(rtcPeer);
        peers.push(rtcPeer);
        
        localStream.getTracks().forEach(function (track) {
			rtcPeer.addTrack(track, localStream);
		});

		return rtcPeer;
	}

	function createVideoTag() {
		var video = document.createElement("video");
		document.getElementById("peer-container").appendChild(video);
		return video;
	}

	function initLocalSDP(peer) {
		peer.createOffer(offerOptions).then(function (desc) {
			peer
				.setLocalDescription(desc)
				.then(function () {
					// Send to receiver
					sendRtcMessage(rtcActions.sendSDP, peer.peerIp, desc);
				})
				.catch(onError);
		});
	}

	function onReceiveSDP(desc, peerIp) {
		console.log("Receive SDP", desc);
		initVideoCall(peerIp, function (peer) {
			peer
				.setRemoteDescription(desc)
				.then(function () {
					peer
						.createAnswer()
						.then(function (desc) {
							peer.setLocalDescription(desc).catch(onError);
							// Answer to caller
							sendRtcMessage(rtcActions.answerSDP, peerIp, desc);
						})
						.catch(onError);
				})
				.catch(onError);

			if (icecandidates[peerIp]) {
				icecandidates[peerIp].forEach(function (candidate) {
					onReceiveIceCandidate(candidate, peerIp);
				});
				delete icecandidates[peerIp];
			}
		});
	}

	function onReceiveAnswerSDP(desc, peerIp) {
		var rtcPeer = getRTCPeerByIp(peerIp);
		if (rtcPeer) {
			rtcPeer.setRemoteDescription(desc).catch(onError);
		} else {
			console.error("RTC peer not found", peerIp);
		}
	}

	function onIceCandidate(e) {
		if (!e.candidate) {
			return;
		}
		sendRtcMessage(rtcActions.icecandidate, this.peerIp, e.candidate);
	}

	function onReceiveIceCandidate(candidate, peerIp) {
		console.log("Receive icecandidate", candidate);
		if (!candidate) {
			return;
		}
		var rtcPeer = getRTCPeerByIp(peerIp);
		if (rtcPeer) {
			rtcPeer.addIceCandidate(candidate).catch(onError);
		} else {
			icecandidates[peerIp] = icecandidates[peerIp] || [];
			icecandidates[peerIp].push(candidate);
		}
	}

	function gotRemoteStream(e) {
		console.log("Received remote stream", e);
		if (this.remoteVideo.srcObject !== e.streams[0]) {
			this.remoteVideo.srcObject = e.streams[0];
			this.remoteVideo.play();
		}
	}

	function onIceStateChange() {
		this._iceConnectionStates.push(this.iceConnectionState);
		logRtcPeerStates(this);
	}

	function onConnectionStateChange() {
		this._connectionStates.push(this.connectionState);
		logRtcPeerStates(this);
	}

	function onSignalingStateChange() {
		this._signalingStates.push(this.signalingState || this.readyState);
		logRtcPeerStates(this);
	}

    function logRtcPeerStates(peer) {
        var message = 'RTCPeerConnaction: ' + peer.peerIp + '\n';
        message += "-----------\n";
        message += 'SignalingState: ' + peer._signalingStates.join(', ') + '\n';
        message += 'ConnectionState: ' + peer._connectionStates.join(', ') + '\n';
        message += 'IceConnectionState: ' + peer._iceConnectionStates.join(', ') + '\n';
        message += "-----------";
        logMessage(message);
    }

	function onError(e) {
		console.log("Error", e);
	}

	function rtcMessageHandler(payload) {
		console.log("Receive rtc action", payload);
		switch (payload.action) {
			case rtcActions.sendSDP:
				onReceiveSDP(payload.message, payload.fromIp);
				break;
			case rtcActions.answerSDP:
				onReceiveAnswerSDP(payload.message, payload.fromIp);
				break;
			case rtcActions.icecandidate:
				onReceiveIceCandidate(payload.message, payload.fromIp);
				break;
			case rtcActions.endCall:
				stopRtcPeer(payload.fromIp);
				break;
			case rtcActions.joinCall:
				startVideoCall(payload.fromIp);
				break;
		}
	}

	function sendRtcMessage(action, peerIp, data) {
		var message = {
			ip: peerIp,
			fromIp: localIp,
			action: action,
			message: data,
		};
		console.log("Send rtc action", message);
		if (localMeeting) {
			if (action == rtcActions.endCall) {
				return closeLocalMeeting();
			}
			localMeeting.sendMessage(message);
		} else {
			voIPServer.sendMessage(message);
		}
	}

	function getRTCPeerByIp(ip) {
		for (var i = 0; i < peers.length; i++) {
			if (peers[i].peerIp === ip) {
				return peers[i];
			}
		}
	}

	function removeRTCPeer(ip) {
		var peer = getRTCPeerByIp(ip);
		console.log("Remove peer", ip, peer);
		if (peer) {
			peer.close();
			peer.remoteVideo.remove();
			peers.splice(peers.indexOf(peer), 1);
		}
	}

	function closeLocalMeeting() {
		if (localMeeting) {
			localMeeting.destroy();
		}
		groupCallData = null;
		localMeeting = null;
	}
}

function logMessage(data) {
	var element = document.createElement("div");
	element.innerText = data;
	document.getElementById("message-board").append(element);
}
