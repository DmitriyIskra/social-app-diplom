export default class ControllApp {
    constructor(redraw) {
        this.redraw = redraw;
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
    }

    init() {
        this.registerEvents();

        this.redraw.start();
    }

    registerEvents() {
        this.app.addEventListener('click', this.onClick);
        this.formText.addEventListener('submit', this.onSubmit);
        this.messages.addEventListener('scroll', this.onScroll);
        this._addFile.addEventListener('change', this.onChange);
    }

    onClick(e) {
        if(e.target.matches('.icon-open-shared-side')) {
            this.redraw.openShare();
        }

        if(e.target.matches('.close-shared-titles')) {
            this.redraw.closeShare();
        }

        if(e.target.matches('.wr-add-file')) {
            this.redraw.addFile();
        }
    }
 
    onSubmit(e) {
        e.preventDefault(); 
        // получаем текст из поля
        const message = this.inputText.value;

        // отправляем текст в функцию в веб сокет
        this.redraw.getMessageWs('text', message);

        this.formText.reset();

        console.log('submit')
    }

    onScroll(e) {
        if(e.target.scrollTop) {
            
        }
    }

    onChange(e) {
        const file = e.target.files && e.target.files[0];
        console.log(file.name)
        const formData = new FormData(); //this.formAddFile

        formData.append('file', file)
        
        this.redraw.getNewFile(formData);
    }
} 