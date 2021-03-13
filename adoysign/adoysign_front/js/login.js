function login(){
    if(localStorage.getItem("id")){
        alert("ERR");
    }

    var userid = document.getElementById("userid");
    var password = document.getElementById("password");
    var mydata = {
        email: userid.value,
        password : password.value
    };
    axios.post('http://192.168.137.129:8081/user/login', mydata)
    .then(function(response){
        localStorage.setItem( response.data.user.eos_account, response.data.token);
        localStorage.setItem("id", response.data.user.eos_account )
        window.location.href='index_login.html';
     })
    .catch(err =>{
         alert("로그인 실패");
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