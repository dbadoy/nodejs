
let temp;
function capture(){

    tt();


    html2canvas(document.getElementById('container'))
    .then(function(canvase){
        

        document.getElementById('result').style.display= 'block';
        document.getElementById('container').style.display= 'none';
        
        temp = canvase.toDataURL('image/png');
        drawImg(canvase.toDataURL('image/png'));
    }).catch(err =>{console.log(err);})
}

function setIPFS(){ //eos_account, privatekey
    let canvas = document.getElementById('canvas');
    let tmp = localStorage.getItem("id");

    const mydata = { 
        "eos_account" : tmp,
        "title" : document.getElementById('title').value,
        "privatekey" : document.getElementById('privkey').value,
        "document" : canvas.toDataURL()
    }

    axios.post('http:/192.168.137.129:8081/document/setdoc', mydata)
    .then(function(response){
        document.getElementById("print").style.display = 'none';
        document.getElementById("result").style.display = 'none';
        
        document.getElementById("cidDiv").style.display = 'block';
        document.getElementById("cid").innerText = response.data.cid;
        document.getElementById("number").innerText = response.data.docnum;
        
     })
    .catch(err =>{
         alert("실패");
    })

}

function getDocList(){
    return new Promise((resolve)=>{
        let tmp = localStorage.getItem("id");
    

        let token = localStorage.getItem(tmp)
    
        axios.defaults.headers.common = {'Authorization': 'Bearer '  + token }
    
        axios.post('http://192.168.137.129:8081/document/getdoclist', {eos_account: tmp}) 
        .then(res =>{
            resolve(res.data);
        }).catch(err =>{
             alert("ERR" + err);
        })
    })
}

function checkdoc(){
    return new Promise((resolve)=>{
        let tmp = localStorage.getItem("id");
        let token = localStorage.getItem(tmp)
        const docnum = document.getElementById('input_docnum').value;
        const doc = document.getElementById('input_doc').value;
    
        axios.defaults.headers.common = {'Authorization': 'Bearer '  + token }
    
        axios.post('http://192.168.137.129:8081/document/checkdoc', {eos_account: tmp, docnum: docnum, doc: doc}) 
        .then(res =>{
            if(res.data.result){
            document.getElementById('checkdoc').style.display='none';
            document.getElementById('result').style.display='block';
            document.getElementById('my_docnum').innerText = docnum;
            document.getElementById('my_dochash').innerText = res.data.inBlock;
            resolve(res.data);
            }
            else if(res.data.result == 0){
                alert("다른 문서에 서명 시도 중입니다. 다시 한 번 확인해주세요.");
            }
            else{
                alert("존재하지 않는 문서번호입니다.");
            }

        }).catch(err =>{
             alert("잘못된 입력입니다.");
        })
    })
}

function checkcode(){
    return new Promise((resolve)=>{
        let tmp = localStorage.getItem("id");
        let token = localStorage.getItem(tmp)
        const signcode = document.getElementById('input_signcode').value;

        console.log(signcode);
        axios.defaults.headers.common = {'Authorization': 'Bearer '  + token }
    
        axios.post('http://192.168.137.129:8081/signcode/getsignnum', {eos_account: tmp, signCode: signcode}) 
        .then(res =>{
            if(res.data.result ==2){
                alert("이미 사용된 signCode 입니다...");
            }
            else if(res.data.result==1){
                alert("존재하지 않는 Signcode입니다...");
            }
            else{
            document.getElementById('signnum_div').style.display = 'block';
            document.getElementById('result_signnum').innerText = res.data.signnum;
            document.getElementById('input_signcode').disabled = true;
        }
        }).catch(err =>{
             alert("존재하지 않는 Signcode입니다..." + err);
        })
    })

}

function signature(){
    let tmp = localStorage.getItem("id");
    let token = localStorage.getItem(tmp)
    axios.defaults.headers.common = {'Authorization': 'Bearer '  + token }

    const mydata = {
        eos_account: tmp,
        signnum : document.getElementById('result_signnum').innerText,
        signcode: document.getElementById('input_signcode').value,
        docnum: document.getElementById('my_docnum').innerText,
        dochash: document.getElementById('my_dochash').innerText,
        privatekey: document.getElementById('input_privatekey').value
    }
    axios.post('http:/192.168.137.129:8081/document/signdoc', mydata)
    .then( res => {
        alert("서명 성공");
        window.location.href = "../userPage.html";

     })
    .catch(err =>{
         alert("실패");
    })
}

function checkSigns(){
    let tmp = localStorage.getItem("id");
    const docnum = document.getElementById('input_docnum').value;

    const mydata = {
        eos_account: tmp,
        docnum : docnum
    }

    axios.post('http://192.168.137.129:8081/document/getsigner', mydata)
    .then( res => {
        document.getElementById('docnum').innerText = docnum;
        document.getElementById('input').style.display = 'none';
        document.getElementById('result').style.display = 'block';
        
       createEdittable(res.data.signer.length)
       for(let i = 0; i < res.data.signer.length; i++){
           
           document.getElementById('editA'+i).innerText = " "+ res.data.signer[i].signer + "　　　　　" +
           res.data.signer[i].signnum +"　　　　　"+res.data.signer[i].signcode  + '\n\n';
       }

     })
    .catch(err =>{
         alert("존재하지 않는 문서입니다." + err);
    })


}

function createEdittable(n){
    return new Promise((resolve)=>{
  const ul = document.getElementById("exam");
    for(let i = 0; i < n; i ++){
        const newA = document.createElement("a");
        newA.setAttribute("id", "editA"+i);
        ul.appendChild(newA);
        resolve(1);
    }

    
    })
}
function addP(n){
    return new Promise(resolve=>{
        for(let i =0; i < n; i ++){
            const target_a = document.getElementById("editA"+i);
            const linebreak = document.createElement("br");
            const newP = document.createElement('p');
            newP.setAttribute("value","zz")
            newP.setAttribute("id", "editP"+i)
            target_a.appendChild(newP);
            //target_a.appendChild(linebreak);
            resolve(1);
        }
    })
}
function tt(){
    document.getElementById('head').innerText = '';
    document.getElementById('mytext').style.display = 'none';
    document.getElementById('firtstDiv').style.display = 'none';
    document.getElementById('print').style.display = 'block';

    const tmp = document.getElementById('mytext').value;
    document.getElementById('print').innerText = tmp;
}
function initial(){
    temp = '';
    document.getElementById('head').innerText = '새 문서 작성';
    document.getElementById('mytext').style.display = 'inline-block';
    document.getElementById('firtstDiv').style.display = 'block';
    document.getElementById('container').style.display= 'block';
    document.getElementById('print').style.display = 'none';
    document.getElementById('result').style.display= 'none';
    
}
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