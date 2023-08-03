export default class Ws {
    constructor(domain) {
        this.ws = new WebSocket(domain);
    }

    registerWsEvents(renderingMessage, redrawSharedStats) {
        
        this.ws.addEventListener('open', (e) => {
            console.log('ws open');
        })
         
        
        this.ws.addEventListener('message', (e) => { 
            const result = JSON.parse(e.data);
            
            const {chat, stat} = result;

            if(chat && stat) {
                renderingMessage(chat);
                redrawSharedStats(stat[0]);

                return;
            }
            
            console.log('Result of connecting  to ws: ' + result.message);
        })
        
        this.ws.addEventListener('error', (e) => {
            console.log('error');
        })
        
        this.ws.addEventListener('close', (e) => {
            console.log('ws close'); 
        })
 
    } 

    sendWs(data) {
        this.ws.send(data); 
    }
}

