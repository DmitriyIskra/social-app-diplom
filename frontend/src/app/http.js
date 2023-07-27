export default class Http {
    constructor(domain) {
        this.domain = domain;
    }

    async read(formData) {
        return await fetch(`${this.domain}getStart/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json', // чтоб не получать данные как строку, так как мы по сути отправляем строку JSON
            },
            
        })
    }

    async create(formData) {
        return await fetch(`${this.domain}addFile/`, { 
            method: 'POST',
            body: formData 
        })  
    }
}