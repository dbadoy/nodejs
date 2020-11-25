const axios = require("axios");
const cheerio = require("cheerio");
const { clear } = require("console");
const log = console.log;

const register_number = 5068100017;

const params = new URLSearchParams();
params.append('bizNo', register_number);
axios({
     method:"post",
     url: 'https://www.pps.go.kr/gpass/gpassCompany/selectCompanyInfo.do',
     params
}).then(res => {

    var reg = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
    var reg2 = /[a-z]/gi

    var str_data = JSON.stringify(res.data)
    
    var myIndex = str_data.indexOf("사업자등록번호 조회목록");

    var myData = str_data.substr(myIndex);

    myData = myData.replace(reg, "");
    myData = myData.replace(reg2, "");

    myData = myData.split(" ");

    console.log(myData[8] , myData[10], myData[11])
     // 5068100017 포스코 최OO
    })
