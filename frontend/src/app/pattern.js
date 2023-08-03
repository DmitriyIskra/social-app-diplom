export default class Pattern {
    constructor() {
        this.regExp = /(?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?/;
        this.regExpReplace = /((?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?)/g;
        this.template = '<a class="message-link" href="$1">$1</a>';
    }

    createMessage(data) {
        const{id, message, date , url, mimetype} = data; 

            // Обертка для сообщения
            const wrapper = document.createElement('div');
            wrapper.classList.add('wrapper-message')

            // поле именеи
            const name = document.createElement('div');
            name.classList.add('name-message');
            name.textContent = id;

            // если в id имя бота ставим сообщение справа и меняем стили
            if(id != 'chaos') {
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
                link.classList.add('link-download')
                link.href = '#'
                link.setAttribute('data-path', url)
                link.textContent = 'download file'

                text.append(link)
            } else {
                text.textContent = message;
            }
            
            // вставляем дату
            const dateMessage = document.createElement('div');
            dateMessage.classList.add('date-message');
            dateMessage.textContent = date;

            // ------  С О Б И Р А Е М  --------


            wrapper.append(name);

            // Превью, если есть необходимость
            // if(mimetype) {
            //     const wrPrev = document.createElement('div');
            //     wrPrev.classList.add('wr-prev-message');
            //     switch(mimetype) {
            //         case 'image/jpeg': 
            //             const prev = document.createElement('img');
            //             prev.classList.add('prev-message');
            //             prev.src = url;
            //             console.log('url pattern', url)
            //             wrPrev.append(prev);
            //     }

            //     wrapper.append(wrPrev);
            // }

            wrapper.append(text);
            wrapper.append(dateMessage);

            return wrapper;

        
    }
}