const stat = {
    "video-files": 0,
    "image-files": 0,
    "audio-files": 0,
    links: 38,
    voice: 0, 
    "video-message": 0,


    add(type) {
        this[type] += 1;
    }
}



module.exports = {
    stat,
}