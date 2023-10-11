export default class Pattern {
    constructor() {
        this.regExp = /(?:http|https|ftp|ftps):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,3}(?:\/\S*)?/;
        this.regExpReplace = /((?:http|https|ftp|ftps):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,3}(?:\/\S*)?)/g;
        this.template = '<a class="message-link" href="$1">$1</a>';
    }

    createMessage(data) {
        const {id, numId, message, date , url, name: nameFile} = data; 
            // Обертка для сообщения
            const wrapper = document.createElement('div');
            wrapper.classList.add('wrapper-message')
            wrapper.dataset.numid = numId; 

            // поле именеи
            const name = document.createElement('div');
            name.classList.add('name-message');
            name.textContent = id;

            // если в id имя бота ставим сообщение справа и меняем стили
            if(id === 'You') { 
                wrapper.style.alignSelf = 'flex-end';
                wrapper.style.backgroundColor = '#F1D580';
                wrapper.style.border = '4px solid #C9AD58';

                name.style.color = '#8a2be2';
            }

            // создаем поле для тела сообщения
            const text = document.createElement('div');
            text.classList.add('text-message');
            // если там есть ссылка преобразуем
            if(this.regExp.test(message)) {
                text.innerHTML = message.replace(this.regExpReplace, this.template);
            } else if (url) {             
                // если есть url значит это файл, преобразуем

                const link = document.createElement('a');
                const title = document.createElement('div');
                link.classList.add('link-download');
                link.href = '#';
                // отсюда мы будем получаь путь для создания
                // ссылки для скачивания
                link.setAttribute('data-path', url);
                link.textContent = nameFile;

                title.textContent = `${numId}download file:`;
                

                text.append(title);
                text.append(link);
            } else {
                text.textContent = message;
            }
            
            // вставляем дату
            const dateMessage = document.createElement('div');
            dateMessage.classList.add('date-message');
            dateMessage.textContent = date;

            // ------  С О Б И Р А Е М  --------


            wrapper.append(name);


            wrapper.append(text);
            wrapper.append(dateMessage);

            return wrapper;
        
    }

    createShare(data) {
        
        const messages = [];

        const wrMessageList = document.createElement('ul');
        wrMessageList.classList.add('wr-messages-share');

        // !!!!!!!!!!!!!!!!!!!!!!!! МЕСТО ДЛЯ ЗАГЛУШКИ ЕСЛИ ПУСТО

        data.forEach( el => {
            const {message, date, url, name: nameFile} = el;

            const messageShare = document.createElement('li');
            messageShare.classList.add('message-share');

            // // имя от кого сообщение
            // const userName = document.createElement('div');
            // userName.classList.add('share-user-name');

            const dateShare = document.createElement('div');
            dateShare.classList.add('share-message-date');
            dateShare.textContent = date;

            // создаем поле для тела сообщения
            const textMessageShare = document.createElement('div');
            textMessageShare.classList.add('text-message-share');

            if(el.type === 'video-files' 
            || el.type === 'image-files' 
            || el.type === 'audio-files'
            || el.type === 'voice-message'
            || el.type === 'video-message') {

                const link = document.createElement('a');
                const title = document.createElement('div');
                link.classList.add('link-download-share');
                link.href = '#';

                // отсюда мы будем получаь путь для создания
                // ссылки для скачивания
                link.setAttribute('data-path', url);
                link.textContent = nameFile;

                title.textContent = `file:`;

                textMessageShare.append(title);
                textMessageShare.append(link);
                
            }

            if(el.type === 'links') {
                const formatMessage = message.replace(this.regExpReplace, this.template);
                textMessageShare.innerHTML = formatMessage;
            }


            messageShare.append(dateShare);
            messageShare.append(textMessageShare);

            messages.push(messageShare);
        })

        return messages;
    }
}