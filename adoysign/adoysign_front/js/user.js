function getUserData(){
    return new Promise((resolve)=>{
        let tmp = localStorage.getItem("id");
    

        let token = localStorage.getItem(tmp)
    
        axios.defaults.headers.common = {'Authorization': 'Bearer '  + token }
    
        axios.post('http://192.168.137.129:8081/user/mydata', {eos_account: tmp, userid :tmp}) 
        .then(res =>{
            resolve(res.data);
        }).catch(err =>{
             alert("ERR" + err);
        })
    })
}

function logout(){
    const userid = localStorage.getItem("id");

    if(localStorage.getItem(userid)){
        localStorage.removeItem(userid);
        localStorage.removeItem("id");
        alert(" 로그아웃 완료 !");
        window.location.href="index.html"
    }else{
        alert("로그인부터 하세요");
        window.location.href="index.html"
    }
}

function toggle(){
    var div = document.getElementById("toggleData")
    var myBtn = document.getElementById("toggleBtn");
    if(div.style.display=='none'){
        myBtn.innerText="↑";
        div.style.display='block';
    }else{
        myBtn.innerText="↓";
        div.style.display="none";
    }

}

function createSigncode(){
    return new Promise((resolve)=>{
    let tmp = localStorage.getItem("id");
    

    let token = localStorage.getItem(tmp)
    const privatekey = document.getElementById("privatekey").value;

    axios.defaults.headers.common = {'Authorization': 'Bearer '  + token }

    axios.post('http://192.168.137.129:8081/signcode/create', {eos_account: tmp, privatekey : privatekey}) 
    .then(res =>{
        console.log(res)
        document.getElementById('input').style.display = 'none';
        document.getElementById('signNum').innerText = res.data.signnum;
        document.getElementById('signCode').innerText = res.data.signcode;
        document.getElementById('output').style.display = 'block';
        
        resolve(res.data);

    }).catch(err =>{
         alert("잘못된 프라이빗키입니다.");
    })
})

}







function createEdittable(n){
    return new Promise((resolve)=>{
  const ul = document.getElementById("exam");
    for(let i = 0; i < n; i ++){
        const newA = document.createElement("a");
        newA.setAttribute("id", "editA"+i);
        newA.setAttribute("href", "certifibox.html");
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

function statusParse(n){
        switch(n){
            case 1:
                return "계약서 작성 중";
            case 2:
                return "계약서 작성완료";
            case 3:
                return "퇴직서 작성 중";
            case 4:
                return "작성완료";
            default:
                break;

        }
}



