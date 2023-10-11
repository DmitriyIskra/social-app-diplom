export default class Notifi {
    constructor(http) {
        this.http = http;
        this.notification = null;

        this.closeNitificaction = this.closeNitificaction.bind(this);
    }

    async init() {
        // НАПОМИНАНИЯ ПРОВЕРЯЮТСЯ И ЗАГРУЖАЮТСЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
        // проверяем даты для напоминания, их может быть несколько
        // var msUTC = Date.parse('2012-01-26T13:51:50.417Z') заюзать in JSON may be string in formate 
        // YYYY-MM-DDTHH:mm:ss.sssZ - Z это временная зона
        // тогда {date: YYYY-MM-DDTHH:mm:ss.sssZ, message: ...}

        // делаем запрос на сервер за напоминаниями
        const response = await this.http.read(null, 'getNotification/');
        const data = await response.json();

        // если с сервера пришло false значит напоминаний нет
        if(data.status === 'false') {
            return;
        }

        // сегодняшняя дата
        const currentDate = new Date();
        const todayDate = currentDate.getDate();
         
        data.forEach( el => {
            // плучаем дату установленную для уведомления
            const setDate = new Date(el.date)
            
            if(currentDate < setDate && todayDate === setDate.getDate()) {
                this.checkPermission(el.message)
            }
        });        
    }

    registerEvents() {
        this.notification.addEventListener('click', () => this.closeNitificaction)
    }

    async checkPermission(message) {
        console.log(Notification)
        if(!window.Notification) {
            console.log('Браузер не поддерживает уведомления')
            return;
        }

        if(Notification.permission === 'granted'){
            console.log('notification granted')
            this.showNotification(message);
            return;
        }


        if(Notification.permission === 'default') {
            console.log('notification default')
            const permission = await Notification.requestPermission();
            if(permission === 'granted')
                console.log('notification requested and granted');
                this.showNotification(message);
        }
            
    }

    showNotification(message) {
        this.notification = new Notification('Напоминание', {
            body: message,
        });

        this.registerEvents();
    }

    closeNitificaction() {
        this.notification.close();
    }
}