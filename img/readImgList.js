let fs = require('fs');
let ary = fs.readdirSync('./');
let result = [];

ary.forEach(function (item) {
    if(/\.(PNG|JPG|JPEG|GIF)/i.test(item)){
        //=>图片
        result.push(item);
    }
});

fs.writeFileSync('./result.txt',JSON.stringify(result),'utf-8');
