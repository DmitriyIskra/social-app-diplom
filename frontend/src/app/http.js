export default class Http {
    constructor(domain) {
        this.domain = domain;
    }

    async read(data, method) {
        if(method === 'getStart/') {
            return await fetch(`${this.domain}${method}`, { // getStart/
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json', // чтоб не получать данные как строку, так как мы по сути отправляем строку JSON
                },
                
            })
        }

        if(method === 'downloadFile/') {
            return await fetch(`${this.domain}${method}${data}`)
        }
    }

    async create(formData) {
        return await fetch(`${this.domain}addFile/`, { 
            method: 'POST',
            body: formData 
        })  
    } 
}