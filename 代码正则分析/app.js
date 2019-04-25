var fs = require('fs');
var path = require("path");
var async = require('async');
var lei = require('lei-stream');
var readLine = require('lei-stream').readLine;

var root = path.join("/Users/caicai/git/hmkx/jiankangjie");
var allfiles = [];
var inherits = {};//继承关系表 类名称：类名称
var presents = {};//跳转关系
var pushs = {};
var implementations = [];//主要类

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
        // console.log(err);
        // console.log(implementations,inherits);
        var allControllers = implementations.filter(function (value) {
            var superC = inherits[value]
            while (superC != null){
                if (superC == 'UIViewController'){
                    return true;
                }
                superC = inherits[superC];
            }
            return false;
        });
        // console.log(allControllers,presents,pushs);
        logJsonTocvs(pushs);
    })
}

function analysis(file,cb) {
    // console.log(file);
    var s = readLine(fs.createReadStream(file), {
        newline: '\n',
        autoNext: false
    });
    var localValues = {};
    var localImplementation = [];
    var localPresents = [];
    var localPushs = [];
    s.on('data', function (data) {
        regExp = /@implementation[\s]*([\w]*)/g; //使用g选项
        res = regExp .exec(data);
        if (res) {
            implementations.push(res[1]);
            localImplementation.push(res[1]);
        }

        regExp = /@interface[\s]*([\w]*)[\s]*:[\s]*([\w]*)(<[\s]*([\S]*)[\s]*>)?/g; //使用g选项
        res = regExp .exec(data);
        if (res) {
            inherits[res[1]] = res[2];
        }

        regExp = /[\s]*([\w]*)[\s]*\*[\s]*([\w]*)/g; //使用g选项
        res = regExp .exec(data);
        if (res) {
            if (res.length>2 && res[1].length>0 && res[2].length>0) {
                localValues[res[2]] = res[1];
            }
        }

        regExp = /[\s]*([\S]*)[\s]*presentViewController[\s]*:[\s]*([\w]*)[\s]*animated[\s]*:[\s]*([\w]*)[\s]*completion[\s]*:/g; //使用g选项
        res = regExp .exec(data);
        if (res) {
            localPresents.push(localValues[res[2]]);
        }

        regExp = /[\s]*([\S]*)[\s]*pushViewController[\s]*:[\s]*([\w]*)[\s]*animated[\s]*:[\s]*([\w]*)[\s]*/g; //使用g选项
        res = regExp .exec(data);
        if (res) {
            localPushs.push(localValues[res[2]]);
        }

        s.next();
    });
    s.on('end', function() {
        // console.log('end');
        cb();
        if (localImplementation.length && localPresents.length){
            if (localPresents.length){
                presents[localImplementation[localImplementation.length-1]]=localPresents;
            }
            if (localPushs.length){
                pushs[localImplementation[localImplementation.length-1]]=localPushs;
            }
        }
    });
    s.on('error', function(err) {
        console.error(err);
        cb(err);
    });
}

function logJsonTocvs(jsonModel) {
    if (Array.isArray(jsonModel)){
        for (var i=0;i<jsonModel.length;i++){
            console.log(jsonModel[i]);
        }
    } else {
        for(var key in jsonModel){
            var str = ''+jsonModel[key];
            str = str.replace(/\,/g," ");
            console.log(key+','+str);
        }
    }
}