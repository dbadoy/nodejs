
function checkid(){
    const tempid = document.getElementById("email");

    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    var email = document.getElementById('email').value;
    if (email == '' || !re.test(email)) {
        alert('올바른 이메일 형식이 아닙니다. 다시 입력하세요.');			   
    }
    else{
        axios.post('192.168.137.129:8081/user/checkid', {email :tempid.value}) 
        .then(res =>{
            alert("사용 가능합니다 !")
            tempid.disabled = true;
        }).catch(err =>{
             alert("사용 할 수 없는 계정입니다." );
        })
    }
}

function checkeosid(){
    const eosid = document.getElementById("eos_account");
    if(eosid.value.length != 12){ alert("EOS계정은 12글자로 정해야합니다.")}
    else{
    axios.post('192.168.137.129:8081/user/checkeosAccount', {eos_account :eos_account.value}) 
    .then(res =>{
        alert("사용 가능한 계정입니다.");
        document.getElementById("eos_account").disabled = true;
        }).catch(err =>{
            alert("존재하지 않는 EOS 계정입니다 !" );
        })
    }
}

function register(){
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const name = document.getElementById("name");
    const eos_account = document.getElementById("eos_account");
    const eos_publickey = document.getElementById("eos_publickey");
    const eos_privatekey = document.getElementById("eos_privatekey");

    if(!(email.disabled&&eos_account.disabled)){ alert("아직 작성하지 않은 항목이 있습니다.")}

    axios.post('192.168.137.129:8081/user/register', 
    {email: email.value, password: password.value, name:name.value, eos_account: eos_account.value
        , eos_publickey: eos_publickey.value, eos_privatekey: eos_privatekey.value
    }
    ) 
    .then(res =>{
        if(res.data.flag ==1) { alert("EOS 계정의 KEY가 잘못 입력되었습니다.\n다시 진행해주세요.")}
        else{
            alert("회원가입성공 !\n이메일 인증을 진행해주세요.");
            window.location.href="index.html";
        }
        

        
        }).catch(err =>{
            alert("회원가입 실패..." +err);
        })
}

