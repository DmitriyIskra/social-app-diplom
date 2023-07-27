export default class Pattern {
    constructor() {
        this.regExp = /(?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?/;
        this.regExpReplace = /((?:http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?)/g;
        this.template = '<a class="message-link" href="$1">$1</a>';
    }
// .replace(/((https|http):\/\/.{0,}\.[a-z]{0,10}(\s{0,1}|\/{0,1})$)/gi, '<a href="$1">$1</a>')
    createMessage(data) {
        const{id, message, date} = data;


            const wrapper = document.createElement('div');
            wrapper.classList.add('wrapper-message')

            const name = document.createElement('div');
            name.classList.add('name-message');
            name.textContent = id;

            if(id != 'chaos') {
                wrapper.style.alignSelf = 'flex-end';
                wrapper.style.backgroundColor = '#F1D580';
                wrapper.style.border = '4px solid #C9AD58';

                name.style.color = '#8a2be2';
            }

            const text = document.createElement('div');
            text.classList.add('text-message');
            if(this.regExp.test(message)) {
                text.innerHTML = message.replace(this.regExpReplace, this.template);
            } else {
                text.textContent = message;
            }
            
            const dateMessage = document.createElement('div');
            dateMessage.classList.add('date-message');
            dateMessage.textContent = date;

            wrapper.append(name);
            wrapper.append(text);
            wrapper.append(dateMessage);

            return wrapper;

        
    }
}