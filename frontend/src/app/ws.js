export default class Ws {
    constructor(domain) {
        this.ws = new WebSocket(domain);
    }

    registerWsEvents(renderingMessage, redrawSharedStats) {
        
        this.ws.addEventListener('open', () => { 
            console.log('ws open');
        })
         
        
        this.ws.addEventListener('message', (e) => { 
            const result = JSON.parse(e.data);
            console.log(e.data)
            const {chat, stat} = result;
            
            if(chat && stat) {
                renderingMessage(chat);
                redrawSharedStats(stat[0]);

                return;
            } 

            if(chat) {
                renderingMessage(chat);
                return;
            }
            
            console.log('Result of connecting  to ws: ' + result.message);
        })
        
        this.ws.addEventListener('error', () => {
            console.log('error');
        })
        
        this.ws.addEventListener('close', () => {
            console.log('ws close'); 
        })
 
    } 

    sendWs(data) {
        this.ws.send(data); 
    }
}

