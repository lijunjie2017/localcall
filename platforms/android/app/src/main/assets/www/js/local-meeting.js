function LocalMeeting(wsUri) {
    this.ws = new WebSocket(wsUri);
    this.ws.onopen = function(e) {
        console.log('onopen', e);
    };
    this.ws.onmessage = function(e) {
        var data = JSON.parse(e.data);
        this.sourceId = data.target;
        console.log('onmessage', data);
        this.onMessage(this.transformMessage(data))
    }.bind(this);
    this.ws.onclose = function(e) {
        console.log('onclose', e);
        this.onClose();
    }.bind(this);
}

LocalMeeting.prototype = {
    onMessage: function(message) {},
    onClose: function(message) {},
    sendMessage: function(message) {
        var data = this.transformPayload(message);
        console.log('Send message to Android Box', data);
        this.ws.send(JSON.stringify(data));
    },
    transformPayload: function(payload) {
        return {
            source: this.sourceId,
            target: payload.ip,
            action: payload.action,
            message: payload.message
        };
    },
    transformMessage: function(message) {
        return {
            fromIp: message.source || message.target,
            action: message.action,
            message: message.message
        };
    },
    destroy: function() {
        this.ws.close();
    }
}