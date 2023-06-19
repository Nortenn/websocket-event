let oldfunc = {};
let newfunc = {};
let SPS = 0;
let RPS = 0;
let lastSend = Date.now();

const messageHandler = e => {
    if(typeof e.data == "string"){
        let msg = JSON.parse(e.data);
        RPS += JSON.stringify(msg).length;
    }
    else{
        const msg = window.msgpack.decode(new Uint8Array(e.data));
        console.log(msg);
        RPS += msg.byteLength;
    };
};

const closeHandler = (event) => {
    console.debug('Close', event);
    window.ws.removeEventListener('message', messageHandler);
    window.ws.removeEventListener('close', closeHandler);
    window.ws.send= oldfunc['window.ws.send'];
};

window.addEventListener("load", () => {
    setTimeout(render, 5000)
});

function render(){
    requestAnimationFrame(render);
    if(Date.now() - lastSend > 60000) {
        SPS = 0;
        RPS = 0;
        lastSend = Date.now();
    };
};

window.WebSocket=newfunc.webSocket=new Proxy(window.WebSocket,{
    construct:function(target,args){
        console.dir(target)
        window.ws = new target(...args);
        setTimeout(()=>{
            var event = document.createEvent('Event');
            event.initEvent('message', true, true);
            window.ws.dispatchEvent(event);},2000);

        window.ws.addEventListener("open", () => {console.dir("test")})
        window.ws.addEventListener('message', messageHandler);
        window.ws.addEventListener('close', closeHandler);

        oldfunc['window.ws.send']=window.ws.send;
        newfunc['window.ws.send']= window.ws.send = new Proxy(window.ws.send, {
            apply: function(target, _this, _arguments) {
                const message = _arguments[0];
                if (typeof message === "object") SPS += message.byteLength;
                else SPS += message.length;
                const decodedMessage = msgpack.decode(message);
                console.debug(decodedMessage);
                window.ws.readyState === window.ws.OPEN && Function.prototype.apply.apply(target, [_this, _arguments]);
            }
        });
        return window.ws;
    }
});
