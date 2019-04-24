var fs = require('fs');
var path = require("path");
var async = require('async');
var lei = require('lei-stream');
const readLine = require('lei-stream').readLine;

var root = path.join("/Users/liyufeng/git/gogs/JianKangJie");
var allfiles = [];
var inherits = {};//继承关系表 类名称：类名称
var implementations = [];//主要类
var imports = {};//引用关系 文件名：引用文件数组

readDirSync(root,allfiles);

var codeFiles = allfiles.filter(function (value, index, arr) {
    return value.endsWith('.h')||value.endsWith('.m')
});

analysisAll(codeFiles);

function readDirSync(path,allfiles){
    var pa = fs.readdirSync(path);
    for (var i=0;i<pa.length;i++){
        var ele = pa[i];
        var info = fs.statSync(path+"/"+ele);
        if(info.isDirectory()){
            readDirSync(path+"/"+ele,allfiles);
        }else{
            allfiles.push(path+"/"+ele);
        }
    }
}

function analysisAll(files) {
    async.eachLimit(files,10,function (item,cb) {
        analysis(item,function (err) {
            cb(err);
        });
    },function (err) {
        console.log(err);
    })
}

function analysis(file,cb) {
    console.log(file);
    const s = readLine(fs.createReadStream(file), {
        newline: '\n',
        autoNext: false
    });
    s.on('data', (data) => {
        // console.log(data);
        s.next();
    });
    s.on('end', () => {
        console.log('end');
        cb();
    });
    s.on('error', (err) => {
        console.error(err);
        cb(err);
    });
}