function capture(){

    html2canvas(document.getElementById('container'))
    .then(function(canvase){
        
        drawImg(canvase.toDataURL('image/png'));
    }).catch(err =>{console.log(err);})
}  
// Capture 'container' element / To png file

function drawImg(imgData){
    return new Promise((resolve, reject) =>{
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0,0, canvas.clientWidth, canvas.height);

        var imageObj = new Image();
        imageObj.onload = function () {
            ctx.drawImage(imageObj, 10, 10);
        };
        imageObj.src = imgData;
    }).catch( err => { reject(err); })
}
