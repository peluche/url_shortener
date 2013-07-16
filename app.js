var fs = require('fs');
var crypto = require('crypto');
var http = require('http');
var express = require('express');
var path = require('path');
var levelup = require('levelup');

var records = {};

// -- starting leveldb --
var dbname = process.env.DB || './mydb';
var db = levelup(dbname, function(err, db) {
    if (err){ throw err; }
    console.log('[+] levelDB: database opened [ %s ]', dbname);
    // init the store here
    db.get('records', function(err, data){
        if (err){ return console.log('[-] no records loaded from db'); }
        records = JSON.parse(data);
        console.log('[+] records laoded: ', records);
    });
});

function sync2db(data) {
    var data_json = JSON.stringify(data);
    db.put('records', data_json, function(err){
        if (err){ return console.log('[-] error syncing to db'); }
    });
}

// -- leveldb loaded --
// -- express config --
var app = express();
var conf_secret = JSON.parse(fs.readFileSync('./secret/secret.json'));

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

// -- end config --
// -- helpers --

function h_jm(res, data) {
    // simple helper to send json message
    return res.end(JSON.stringify(data));
}

function h_je(res, data) {
    // simple helper to send json message
    res.writeHead(500);
    res.end(JSON.stringify(data));
}

var basic_auth = express.basicAuth(function(user, pass) {     
    var valid_creds = conf_secret.creds;
    return user in valid_creds &&
        valid_creds[user] == crypto.createHash('sha1').update(pass).digest('hex');
}, '');

function text_2_slug(text) {
    return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
}

function gen_slug() {
    // TODO : improve me
    // very dumb implementation
    do {
        var timestamp = new Date().getTime();
        var slug = timestamp.toString(36);
    } while (slug in records);
    return slug;
}

// -- end helpers --
// -- routes --

app.get('/', function(req, res) {
    // TODO rewrite me with css
    // validation, ajax and shit ...
    res.render('form.ejs', {layout: false});
});

app.post('/links', basic_auth, function(req, res) {
    var link = (req.body.link || '').trim();
    var slug = (req.body.slug || '').trim();
    var host = (req.headers.host || '').trim();

    link = (link.match(/^http:\/\//)) ? link : 'http://' + link;
    slug = (slug != '') ? text_2_slug(slug) : gen_slug();
    if (link == '') {
        return h_je(res, {err: 'link must be filled'});
    }
    if (slug in records) {
        return h_je(res, {err: 'slug already exist'});
    }

    records[slug] = link;
    sync2db(records);
    return h_jm(res, { ok: 'record created',
                       link: records[slug],
                       slug: slug,
                       url: host + '/' + slug
                     });
});

app.get('/:slug', function(req, res) {
    var slug = (req.params.slug).trim();
    
    if (slug in records) {
        console.log('[+] redirecting to [ %s ]', records[slug]);
        return res.redirect(records[slug]);
    }
    console.log('[-] no link for slug [ %s ]', slug);
    res.render('404.ejs', {layout: false});
});

// -- end routes --

http.createServer(app).listen(app.get('port'), function(){
    console.log('[+] express server listening on port [ %s ]', app.get('port'));
});
