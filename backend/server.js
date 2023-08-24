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

// для добавления имени новой папки куда загружен файл
// что-бы пользоваться глобально 
let subFolder;

app.use(CORS());

app.use(koaBody({  
    text: true,      
    urlencoded: true, 
    // multipart: true, 
    json: true,    
  }));  


app.use(koaStatic(public));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    switch (req.url) {
      case '/addFile/':
        // создаем имя для папки
        subFolder = uuid.v4();
        // прописываем путь к создаваемой папке
        const uploadFolder = public + '/files' + '/' + subFolder;
        // Создаем папку
        fs.mkdirSync(uploadFolder);
        // указываем эту папку для сохраннеия файла
        cb(null, uploadFolder);
        break;
      case '/add-voice/':
        cb(null, public + '/record-audio');
        break;
      case '/add-record-video/':
        cb(null, public + '/record-video'); 
        break; 
      default:
        console.log('unknown url');
    } 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})

const upload = multer({storage});

// можно каждому сообщению задавать уникальный номер, сохранять его на клиенте в data атрибут
// и взяв его найти под каким индексом находится это сообщение в базе данных
// получать следующие десять от него считая назад и отрисовывать их
// также нужно понимать сколько осталось сообщений для загрузки, т.е. если индекс меньше 9, значит нужно делать
// отбор сообщений не 10 штук, а до 0-ого индекса 

// второй вариант сделать счетчик сколько раз сделан запрос на следующие десять сообщений
// и от него отталкиваться
// если актуальное число сообщений при делении на 10 дает остаток например nn%10, то целое число - это 
// количество возможных запросов по 10 сообщений (это должен считать счетчик), а дробная часть это количесвто 
// сообщений по истечению количества возможных запросов по 10 сообщений 



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
  
  
router.get('/downloadFile/:data', async (ctx) => {     
  const{ data } = ctx.params; 
  // разбираем полученный путь на имя папки и имя файла   
  const arr = data.split(':'); 
 
  const pathToFile = public + '/' + 'files' + '/' + arr[0] + '/' + arr[1];
   
  ctx.response.body = fs.createReadStream(pathToFile);
 
  ctx.response.status = 200;   
       
}) 

router.get('/reloadingMessages/:numId', async ctx => {  
  const {numId} = ctx.params;
  console.log(numId)
 
  ctx.response.status = 200;
})

router.post('/addFile/', upload.single('file'), async ctx => {  
  const { fieldname: type, originalname: name, mimetype, path: url} = ctx.request.file;
  
  
  // Добавляем статистику
  if(mimetype.startsWith('image')) stat.add('image-files'); 
  if(mimetype.startsWith('video')) stat.add('video-files'); 
  if(mimetype.startsWith('audio')) stat.add('audio-files'); 
 
  // расщитываем порядковый номер нового сообщения
  let newNumId = chat[chat.length - 1].numId + 1; 
  
  const dataMessage = {     
    id: 'You',  
    numId: newNumId,     
    message: `${newNumId}file uploaded: ${name}`,          
    name,   
    mimetype,
    url: subFolder + ':' + name,    
    date: format(new Date(), 'dd.MM.yy HH:mm'),        
  }   
    
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

  const body = JSON.stringify(resp);  
  ctx.response.body = body;
 
  ctx.response.status = 200;              
})  

// router.post('/add-voice/', upload.single('file'), async ctx => { 
//   console.log('ctx.request.file', ctx.request.file); 
//   stat.add('files');
//   console.log('stat', stat)

//   ctx.response.status = 200;            
// })

// router.post('/add-record-video/', upload.single('file'), async ctx => { 
//   console.log('ctx.request.file', ctx.request.file); 
  

//   ctx.response.status = 200;            
// })
 

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

      // расщитываем порядковый номер нового сообщения
      let newNumId = chat[chat.length - 1].numId + 1; 

      const dataMessage = {
        id: 'You',
        numId: newNumId,
        message: `${newNumId}message`,
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