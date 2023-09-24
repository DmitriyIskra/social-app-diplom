export default class ControllApp {
    constructor(redraw, notifi) {
        this.redraw = redraw;
        this.notifi = notifi;
        this.app = this.redraw.app;
        this.formText = this.redraw.formText;
        this.inputText = this.redraw.inputText;
        this.messages = this.redraw.messages; 
        this.formAddFile = this.redraw.formAddFile;
        this._addFile = this.redraw._addFile;

        this.onClick = this.onClick.bind(this);
        this.onSubmit = this.onSubmit.bind(this); 
        this.onScroll = this.onScroll.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
    }

    init() {
        this.registerEvents();

        this.redraw.start();
        // при загрузке страницы проверить есть ли сохраненные уведомления
        // на предмет напоминаний (напоминания устанавливаются через отправку сообщений по команде)
        // если есть сравнить даты и если сегодняшняя дата совпадает с установленной
        // показываем время с датой и текстом в уведомлении

        this.notifi.init()
    }

    registerEvents() {
        this.app.addEventListener('click', this.onClick);
        this.app.addEventListener('mousedown', this.onMouseDown);
        this.formText.addEventListener('submit', this.onSubmit);
        this.messages.addEventListener('scroll', this.onScroll);
        this._addFile.addEventListener('change', this.onChange);
        this.formAddFile.addEventListener('dragover', this.onDragOver);
        this.formAddFile.addEventListener('drop', this.onDrop);

        
    }

    onClick(e) {
        if(e.target.matches('.icon-open-shared-side')) {
            this.redraw.openShare();
        }

        if(e.target.matches('.close-shared-titles')) {
            this.redraw.closeShare();
        }

        if(e.target.closest('.wr-add-file')) {
            this.redraw.addFile();
        }

        if(e.target.matches('.link-download')) {
            e.preventDefault();
            const path = e.target.dataset.path;
            // const string = url.substr(url.indexOf('files'));
            this.redraw.downloadFile(path);
        }
    }

    onMouseDown(e) {
        if(e.target.matches('.add-voice')) {
            console.log('record voice')
           this.redraw.recordAudio();
        }

        if(e.target.matches('.add-video')) {
            console.log('record video')
           this.redraw.recordVideo();
        }
    }

    onMouseUp(e, data) {

    }
 
    onSubmit(e) {
        e.preventDefault();  
        // получаем текст из поля
        const message = this.inputText.value;

        // команда для установки напоминания @schedule: 18:04 31.08.2019 «last day of summer»
        if(message.startsWith('@schedule')) {
            console.log('schedule', message)

            this.redraw.getMessageWs('schedule', message);
            this.formText.reset();

            return;
        }

        
        if(message.startsWith('@chaos:')) {
            // @chaos: weather
            if(message.indexOf('weather') >= 0) {
                console.log(message)
                this.redraw.getMessageWs('weather', message);
                this.formText.reset();
            }

            // @chaos: time
            if(message.indexOf('time') >= 0) {
                this.redraw.getMessageWs('time', message);
                this.formText.reset();
            } 

            // @chaos: date
            if(message.indexOf('date') >= 0) { 
                this.redraw.getMessageWs('date', message);
                this.formText.reset();
            }

            // @chaos: traffic
            if(message.indexOf('traffic') >= 0) {
                this.redraw.getMessageWs('traffic', message);
                this.formText.reset();
            }

            // @chaos: new-year
            if(message.indexOf('new-year') >= 0) {
                this.redraw.getMessageWs('new-year', message);
                this.formText.reset();
            }

            return;
        }

        // отправляем текст в функцию в веб сокет
        this.redraw.getMessageWs('text', message);

        this.formText.reset();

        console.log('submit')
    }

    onScroll(e) {
        if(e.target.scrollTop === 0) {
            this.redraw.reloadingMessages();
        }
    } 

    onChange(e) {  
        const formData = new FormData(this.formAddFile);
        
        this.redraw.getNewFile(formData, 'addFile/');
    }

    onDragOver(e) {
        e.preventDefault();
    }

    onDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files && e.dataTransfer.files[0];

        const formData = new FormData();
        formData.append('file', file);
        this.redraw.getNewFile(formData, 'addFile/');
        // console.log('dropFile', file); // видим что файл мы все таки получили
    }
} 