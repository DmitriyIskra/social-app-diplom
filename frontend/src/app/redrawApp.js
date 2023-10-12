export default class RedrawApp {
    constructor(app, pattern, http, ws) {
        this.app = app;
        this.pattern = pattern;
        this.http = http; 
        this.ws = ws; 

        this.formText = this.app.querySelector('.form-add-text');
        this.inputText = this.formText.querySelector('.type-text');
        this.messages = this.app.querySelector('.message-place');
        this.sharedCounters = this.app.querySelectorAll('.count-shared-type');
        this.formAddFile = this.app.querySelector('.form-add-file')
        this._addFile = this.app.querySelector('.add-file')

        this.share = this.app.querySelector('.wr-side-shared'); 
        this.wrMessagesShare = this.app.querySelector('.wr-messages-share');

        this.audio = document.querySelector('.audio');

        this.messagesList = null;

        this.blob = null;

        this.redrawSharedStats = this.redrawSharedStats.bind(this);
        this.renderingMessage = this.renderingMessage.bind(this);
        this.sendGeolocation = this.sendGeolocation.bind(this);
        this.errorGeolocation = this.errorGeolocation.bind(this);
        this.recordAudio = this.recordAudio.bind(this);
    }

    async start() { 
        // запускаем слушатели событий ws
        this.ws.registerWsEvents(this.renderingMessage, this.redrawSharedStats);


        const response = await this.http.read(null, 'getStart/');

        const json = await response.json(); 

        const {chat, stat} = json;

        this.renderingMessage(chat, 'start');
        this.redrawSharedStats(stat[0]);

        // запрос геолокации
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.sendGeolocation, this.errorGeolocation)
        }
    }

    async sendGeolocation(position) {
        console.log('start get geolocation')

        const {latitude, longitude} = position.coords;

        const data = JSON.stringify({type:'location', message: {latitude, longitude}})

        if(data) this.sendToWs(data)
    }

    errorGeolocation(error) {
        console.log(error)
    }

    // скачивание файла
    async downloadFile(path) {
        // в path мы помещаем имя папки в которой лежит необходимый файл
        // и имя файла
        const response = await this.http.read(path, 'downloadFile/');
        const blob = await response.blob();

        const arr = path.split(':');

        let link = document.createElement('a');
        link.style = 'position:fixed;top:10px;left:10px;width:100px';
        link.href = URL.createObjectURL(blob);
        link.download = arr[2];
        document.body.append(link);
        
        link.click();
        
        setTimeout(() => {
            link.remove();
            URL.revokeObjectURL(link.href)
        },30)
    }


    // Собираем данные для отправки в ws
    getMessageWs(type, message) {
        const data = JSON.stringify({type, message});   
   
        this.sendToWs(data); 
    }

    // Отправляем данные на сервер через ws 
    sendToWs(data) {
        this.ws.sendWs(data); 
    }

    // перерисовываем статистику по новым полученным данным
    redrawSharedStats(data) {
        let counter = 0;

        for( let key in data ) {

            this.sharedCounters[counter].textContent = data[key];
            
            counter += 1;
        }
    }

    async reloadingMessages() {
        // получаем (первый попавшийся), т.е. самый первый .wrapper-message
        const firstMessage = this.messages.querySelector('.wrapper-message');
        // забираем из data атрибута индекс сообщения, под которым оно находится на сервере
        const numid = firstMessage.dataset.numid;
        
        // считываем с сервера 10 сообщений
        const response = await this.http.read(numid, 'reloadingMessages/');

        try {
            const data = await response.json();

            this.renderingMessage(data, 'reloading');
        } catch (error) {
            console.log('no messages more yet');
        }
        
    }

    // отрисовываем сообщение в поле для сообщений
    renderingMessage(data, mark) { 
        // перебираем chat и получаем экземпляры сообщений
        data.messages.forEach(item => {
            const message =  this.pattern.createMessage(item);
            
            // добавляем сообщения в поле для сообщений
            // если метки нет значит у нас просто есть новое сообщение
            if(!mark) this.messages.append(message);

             
            if(mark === 'start') this.messages.append(message);
            

            if(mark === 'reloading') this.messages.prepend(message);
        })
    

        // Обновляем список сообщений
        this.messagesList = this.messages.querySelectorAll('.wrapper-message');

        // получаем данные об размерах и отступах первых и последних загруженных элементах
        const firstMessageOffsetTop = this.messagesList[0].offsetTop;
        const lastMessageOffsetHeight = this.messagesList[data.messages.length - 1].offsetHeight
        const lastMessageOffsetTop = this.messagesList[data.messages.length - 1].offsetTop

        // вычисляем какую высоту занимают последние загруженные сообщения
        const allH = (lastMessageOffsetHeight + lastMessageOffsetTop) - firstMessageOffsetTop;

        // если меток нет значит было добавлено сообщение
        // прокручиваем к нему
        if(!mark) {
            const index = this.messagesList.length - 1
            this.scrollMessagesToDown(index)
        }

        // при старте прокручиваем страницу вниз
        if(mark === 'start') this.scrollMessagesToDown(data.messages.length - 1);

        // проверка чтоб сократить
        // количество подгруженных сообщений меньше 10 и их общая занимаемая высота на странице
        // больше поля для отображения сообщений
        const result = (data.messages.length < 10 && allH > this.messages.offsetHeight)
        // прокручиваем при подгрузке сообщений
        if(mark === 'reloading' && (data.messages.length === 10 || result)) {
            // передаем  индекс элемента к которому нужно скролить
            // зависит от количества подгруженных сообщений
            this.scrollMessagesToDown(data.messages.length - 1);
        }
        
    }

    scrollMessagesToDown(index) {
        this.messagesList[index].scrollIntoView(false);
        // добавляем к прокрутке 15px пэддинга
        this.messages.scrollTo(0, this.messages.scrollTop + 10)
    }

    async recordAudio() {
        console.log('record audio');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        const recorder = new MediaRecorder(stream); 
        const chunks = [];

        recorder.addEventListener('start', () => {
            console.log('start');
        })
    
        // получение данных
        recorder.addEventListener('dataavailable', (e) => {
            console.log('dataavailable')
            chunks.push(e.data);
        })
    
        // stop в этом обработчике событий будет доступен массив чанков, те кусочков данных
        recorder.addEventListener('stop', () => {
            this.blob = new Blob(chunks, {
                type: 'audio/webm',
            });
        
            const formData = new FormData();
            formData.set('file', this.blob);

            this.getNewFile(formData, 'addVoice/');

            console.log('stop', this.blob)
        })


        recorder.start();

            // остановка потока
        this.app.addEventListener('mouseup', e => {
            if(e.target.matches('.add-voice')) {
                recorder.stop();
                // получаем все треки из поока и останавливаем их
                stream.getTracks().forEach( track => track.stop());
                console.log('recorder stop')
            }
        }, {once: true})
    }


    async recordVideo() {
        console.log('record video');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        const recorder = new MediaRecorder(stream); 
        const chunks = [];

        recorder.addEventListener('start', () => {
            console.log('start');
        })
    
        // получение данных
        recorder.addEventListener('dataavailable', (e) => {
            console.log('dataavailable')
            chunks.push(e.data);
        })
    
        // stop в этом обработчике событий будет доступен массив чанков, те кусочков данных
        recorder.addEventListener('stop', () => {
            this.blob = new Blob(chunks, {
                type: 'video/mp4',
            });
        
            const formData = new FormData();
            formData.set('file', this.blob);

            this.getNewFile(formData, 'addRecordVideo/');

            console.log('stop', this.blob)
        })


        recorder.start();

            // остановка потока
        this.app.addEventListener('mouseup', e => {
            if(e.target.matches('.add-video')) {
                recorder.stop();
                // получаем все треки из поока и останавливаем их
                stream.getTracks().forEach( track => track.stop());
                console.log('recorder stop')
            }
        }, {once: true})
    }

    // отправка файла на сервер
    async getNewFile(formData, method) { 
        const response = await this.http.create(formData, method);
  
        const data = await response.json();

        const {chat, stat} = data;

        if (chat) this.renderingMessage(chat);

        if(stat) this.redrawSharedStats(stat[0]);
    }
    

    // открытие поля статистики на клиенте
    openShare() {
        this.share.classList.add('wr-side-shared_active');
    }

    // получаем список сообщений по типу
    async getShare(type) {
        const res = await this.http.read(type, 'getShared/');
        const result = await res.json();
        
        if(result.length > 0) {
            this.clearShareMessages();

            this.wrMessagesShare.classList.add('wr-messages-share_active');

            this.renderingShare(result);
        }
    }

    renderingShare(data) {
        const messages = this.pattern.createShare(data);
        
        messages.forEach( el => {
            this.wrMessagesShare.append(el);
        })
    }

    // очистка загруженных share
    clearShareMessages() {
        if(this.wrMessagesShare.children.length > 0) {
            [...this.wrMessagesShare.children].forEach( el => el.remove());
        }
    }
 
    // закрытие поля статистики на клиенте
    closeShare() {
        this.wrMessagesShare.classList.remove('wr-messages-share_active');
        this.share.classList.remove('wr-side-shared_active');

        this.clearShareMessages();
    }

    // заставляем работать кнопку добавления файла
    addFile() {
        this._addFile.click(); 
    }
}