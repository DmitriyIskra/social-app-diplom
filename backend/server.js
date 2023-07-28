const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');  
const CORS = require('@koa/cors');
const uuid = require('uuid');  
const { format } = require('date-fns');
const WS = require('ws');
const fs = require('fs');
const koaStatic = require('koa-static');
const path = require('path');
const multer = require('@koa/multer');



const { chat } = require('./db/chat');
const { stat } = require('./db/stat');

const regExp = /(?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?/g;

const Router = require('koa-router'); 
const router = new Router();    

const app = new Koa();    

const public = path.join(__dirname, '/public');



app.use(CORS());

app.use(koaBody({  
    text: true,      
    urlencoded: true, 
    multipart: true, 
    json: true,    
  }));  


app.use(koaStatic(public));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/')
  },
  filename: function (req, file, cb) {
    var fileFormat = (file.originalname).split('.')
    cb(null, file.fieldname + '_' + Date.now() + '.' + fileFormat[fileFormat.length - 1])
  }
})

const upload = multer({dest : './public'});

app.use(upload.any());


router.get('/getStart/', async (ctx) => {  
  // сюда будем собирать последние десять сообщений при старте
  const messages = [];
  let resp = null;

  // В случае если в чате больше 10 сообщений то выбираем крайние 10 сообщений
  if(chat.length > 10) {
    // индекс крайнего элемента
    let i = chat.length - 1;
    // индекс элемента до которого мы берем 10 первых сообщений
    const stopIndex = i - 10 

    // собираем первые 10 загружаемых элементов
    for( i; i > stopIndex; i -= 1) {
      messages.unshift(chat[i]);
    }
     
    resp = {
      chat: { messages },
      stat: [ stat ],
    }
  }   
  else {  
    // иначе в базе сообщений не больше чем 10 
    chat.forEach( item => messages.push( item ));

    resp = {
      chat: { messages },
      stat: [ stat ],
    }
  }
    
  const body = JSON.stringify(resp)

  ctx.response.body = body; 
  ctx.response.status = 200;  
})

  
router.post('/addFile/', async ctx => {  //upload.single('file'),
  // const formData =  ctx.request.body
  // console.log('file', Array.from(formData));
  console.log('ctx.request.body', ctx.request.file); 

  ctx.response.status = 200;            
})  
 

// app.use(router());  
app.use(router.routes()).use(router.allowedMethods());   

const port = process.env.PORT || 7070;  
const server = http.createServer(app.callback());  
 
const wsServer = new WS.Server({
  server
}) 

wsServer.on('connection', stream => {
  stream.on('message', buffer => {

    let arr = []; 
    let data;

    let view = new Uint16Array(buffer);
 
    for(let i = 0; i < view.length; i += 1) { 
      arr[i] = String.fromCharCode(view[i]); 
    }    
   
    const json = arr.join('');
 
    data = JSON.parse(json);
  
    const {type, message} = data; 




    // если тип присланного сообщения text проверяем на наличие ссылки
    if(type === 'text') {
      // проверяем на наличие ссылки
      let testDomain = regExp.test(message);

      if(testDomain) {
        // если ссылка есть получаем их колличество
        let amountDomains = message.match(regExp).length;    
        // обновляем статистику
        stat.links += amountDomains;        
      }  

      const dataMessage = {
        id: 'You',
        message, 
        date: format(new Date(), 'dd.MM.yy HH:mm'),
      }
      // добавляем данные о сообщении в общую базу чата
      chat.push(dataMessage);
 
      // Формируем данные для ответа клиенту
      const resp = {
        chat: {  
          messages: [
            chat[chat.length - 1],   
          ]   
        },
        stat: [stat], 
      }

      stream.send(JSON.stringify(resp));  
    }


    
  })  
 
 
  stream.on('error', e => {  
    console.log('error', e)  
  }) 
 

  stream.on('close', e => {    
    console.log('сlose', e)  
  }) 

  stream.send(JSON.stringify({message: 'Connect successfully'}));
})
 


server.listen(port); 