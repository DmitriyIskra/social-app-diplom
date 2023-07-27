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

        this.messagesList = null;

        this.redrawSharedStats = this.redrawSharedStats.bind(this);
        this.renderingMessage = this.renderingMessage.bind(this);
    }

    async start() {
        // запускаем слушатели событий ws
        this.ws.registerWsEvents(this.renderingMessage, this.redrawSharedStats);


        const response = await this.http.read();

        const json = await response.json(); 

        const {chat, stat} = json;

        this.renderingMessage(chat);
        this.redrawSharedStats(stat[0]);
    }

    getNewFile(formData) {
        this.http.create(formData);
    }

    // Собираем данные для отправки в ws
    getMessageWs(type, message) {
        const data = JSON.stringify({type, message});   
   
        this.sendToWs(data); 
    }
    // Отправляем данные ws
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

    // отрисовываем сообщение в поле для сообщений
    renderingMessage(data) {
        // перебираем chat и получаем экземпляры сообщений
        data.messages.forEach(item => {
            const message =  this.pattern.createMessage(item);
            
            // добавляем сообщения в поле для сообщений 
            this.messages.append(message);
        })

        // Обновляем список сообщений
        this.messagesList = this.messages.querySelectorAll('.wrapper-message');

        // Проверяем количество сообщений и удаляем если их больше 10
        // this.clearMessages();

        // прокручиваем страницу к последнему добавленному сообщению
        this.scrollMessagesToDown()
    }

    clearMessages() {
        if(this.messagesList.length > 10) {
            this.messagesList[0].remove();
            
            // Обновляем список сообщений
            this.messagesList = this.messages.querySelectorAll('.wrapper-message');

            // если загрузилось больше 10 сообщений будет перезапускаться и чистить
            this.clearMessages();
        }
    }

    scrollMessagesToDown() {
        // находим крайнее сообщение
        const lastMessage = this.messagesList[this.messagesList.length - 1]
        // прокручиваем страницу к сообщению
        lastMessage.scrollIntoView(false);
        // добавляем к прокрутке 15px пэддинга
        this.messages.scrollTo(0, this.messages.scrollTop + 15)
    }

    openShare() {
        this.share.classList.add('wr-side-shared_active');
    }

    closeShare() {
        this.share.classList.remove('wr-side-shared_active');
    }

    addFile() {
        this._addFile.click(); 
    }
}