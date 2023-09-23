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
const { geolocation } = require('./db/geolocation.js');
const { notifi } = require('./db/notifi');

const regExp = /(?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?/g;

const Router = require('koa-router');  
const router = new Router();    

const app = new Koa();    

const public = path.join(__dirname, '/public'); 

// для добавления имени новой папки куда загружен файл
// что-бы пользоваться глобально 
let subFolder;
let typeFolder;
let uploadFolder;

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
    console.log('req.url', req.url)
    switch (req.url) {
      case '/addFile/':
        // создаем имя для папки
        subFolder = uuid.v4();


        // сохраняем по типу файла
        if(file.mimetype.startsWith('image')) {
          typeFolder = 'img';
        }; 
        if(file.mimetype.startsWith('video')) {
          typeFolder = 'video-files';
        }; 
        if(file.mimetype.startsWith('audio')) {
          typeFolder = 'audio-files';
        };

        // прописываем путь к создаваемой папке
        uploadFolder = public + '/files' + '/' + typeFolder + '/' + subFolder;
        // Создаем папку
        fs.mkdirSync(uploadFolder);  
        // указываем эту папку для сохраннеия файла
        cb(null, uploadFolder); 
        break;
      case '/addVoice/': 
        // создаем имя для папки
        subFolder = uuid.v4();
        // сохраняем название папки для voice
        typeFolder = 'record-audio';
        // прописываем путь к создаваемой папке
        uploadFolder = public + '/files' + '/' + typeFolder + '/' + subFolder;
        // Создаем папку
        fs.mkdirSync(uploadFolder);
        // указываем эту папку для сохраннеия файла
        cb(null, uploadFolder); 
        break;
      case '/addRecordVideo/':
        // создаем имя для папки
        subFolder = uuid.v4();
        // сохраняем название папки для voice
        typeFolder = 'record-video';
        // прописываем путь к создаваемой папке
        uploadFolder = public + '/files' + '/' + typeFolder + '/' + subFolder;
        // Создаем папку
        fs.mkdirSync(uploadFolder);
        // указываем эту папку для сохраннеия файла
        cb(null, uploadFolder);
        break; 
      default:
        console.log('create disc storage', 'unknown url');
    } 
  },
  filename: function (req, file, cb) {
    console.log('file name', file)
    switch (req.url) {
      case '/addFile/':
        cb(null, file.originalname);
        break;
      case '/addVoice/':
        cb(null, subFolder + '.' + 'webm');
        break;
      case '/addRecordVideo/':
        cb(null, subFolder + '.mp4'); 
      break;
      default:
        console.log('create disc storage filename', 'unknown url');
    }
    
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
 

router.get('/reloadingMessages/:numId', async ctx => {  
  const {numId} = ctx.params; 

  if(numId == 0) {
    ctx.response.status = 200;
  
    return;    
  }
  // в этот массив будем набирать десять сообщений   
  let messages = [];   
 
  
  if( numId - 10 >= 0) { 
    for(let i = numId - 1; i >= numId - 10; i -= 1) {    
      messages.push(chat[i]);  
    } 
  } else {
    for(let i = numId - 1; i >= 0; i -= 1) {
      messages.push(chat[i]); 
    } 
  }
  
  const json = JSON.stringify({messages});

  ctx.response.body = json;  
  ctx.response.status = 200; 
})

// Получаем список напоминаний если они есть    
router.get('/getNotification/', async ctx => {      
  let data = [];   

  if(notifi.size === 0) {     
    data.push({status: false}); 
  } else { 
    notifi.forEach( el => data.push(el));  
  };
  const body = JSON.stringify(data);

  ctx.response.body = body;   
  ctx.response.status = 200;  
}) 

// Загрузка файла на сервер
router.post('/addFile/', upload.single('file'), async ctx => {   
  const { originalname: name, mimetype } = ctx.request.file;
  
  
  // Добавляем статистику
  if(mimetype.startsWith('image')) stat.add('image-files');  
  if(mimetype.startsWith('video')) stat.add('video-files'); 
  if(mimetype.startsWith('audio')) stat.add('audio-files'); 
 
  // рассчитываем порядковый номер нового сообщения
  let newNumId = chat[chat.length - 1].numId + 1; 
  
  const dataMessage = {     
    id: 'You',  
    numId: newNumId,     
    message: `${newNumId}file uploaded: ${name}`,          
    name,   
    mimetype,
    url: typeFolder + ':' + subFolder + ':' + name,    
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

// Скачивание файла с сервера
router.get('/downloadFile/:data', async (ctx) => {       
  const{ data } = ctx.params; 
  // разбираем полученный путь на имя папки и имя файла   
  const arr = data.split(':'); 
 
  const pathToFile = public + '/' + 'files' + '/' + arr[0] + '/' + arr[1] + '/' + arr[2];
     
  ctx.response.body = fs.createReadStream(pathToFile);
 
  ctx.response.status = 200;      
       
})

 
// Получаем аудио запись
router.post('/addVoice/', upload.single('file'), async ctx => { 
  console.log('ctx.response.file', ctx.request.file)
  const { filename: name, mimetype } = ctx.request.file;

  // Добавляем статистику
  stat.add('voice');

  // рассчитываем порядковый номер нового сообщения 
  let newNumId = chat[chat.length - 1].numId + 1; 
  
  const dataMessage = {     
    id: 'You',  
    numId: newNumId,     
    message: `${newNumId}file uploaded: ${name}`,          
    name,   
    mimetype,
    url: typeFolder + ':' + subFolder + ':' + name,     
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

// Получаем видео запись
router.post('/addRecordVideo/', upload.single('file'), async ctx => { 
  console.log('ctx.response.file', ctx.request.file)
  const { filename: name, mimetype } = ctx.request.file;

  // Добавляем статистику
  stat.add('video-message');  

  // рассчитываем порядковый номер нового сообщения 
  let newNumId = chat[chat.length - 1].numId + 1; 
  
  const dataMessage = {      
    id: 'You',  
    numId: newNumId,     
    message: `${newNumId}file uploaded: ${name}`,          
    name,   
    mimetype,
    url: typeFolder + ':' + subFolder + ':' + name,     
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
        message: `${newNumId}${message}`,
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
      // отправляем сообщение всем клиентам активным 
      // Array.from(wsServer.clients)     
      // .filter( client => client.readyState === WS.OPEN)   
      // .forEach( client => client.send(JSON.stringify(resp)));
    }

    if(type === 'location') {
      geolocation.set(stream, message);     
    }

    if(type === 'schedule') {
      // @schedule: 18:04 31.08.2019 "last day of summer"
      // YYYY-MM-DDTHH:mm:ss.sssZ
      // {date: YYYY-MM-DDTHH:mm:ss.sssZ, message: ...}
      let arr = message.split(' ')

      // убирааем @schedule: 
      arr.shift();

      // формируем время
      let time = arr[0];
      let formatTime = time + ':00:000Z';
      // формируем дату
      let date = arr[1];
      date = date.split('.');
      const formatDate = `${date[2]}-${date[1]}-${date[0]}`;
      // формируем текст сообщения
      arr.splice(0, 2);
      let textMessage = arr.join(' ');
      // формируем объект для сохранения уведомления 
      notifi.add({
        date: `${formatDate}T${formatTime}`,
        message: time + ' ' + date.join('.') + ' ' + textMessage
      })   
    } 

    // погода
    if(type === 'chaos: weather') {

    }

    // время
    if(type === 'chaos: time') {

    }

    // дата
    if(type === 'chaos: date') {

    }

    // пробки
    if(type === 'chaos: traffic') {

    }

    // сколько дней до нового года
    if(type === 'chaos: new-year') {

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