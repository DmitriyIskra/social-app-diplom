const stat = {
    videos: 0,
    files: 0,
    "audio-files": 0,
    links: 1,
    voice: 0, 
    "video-message": 0,


    add(type) {
        this[type] += 1;
    }
}



module.exports = {
    stat,
}