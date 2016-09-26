var express = require('express');
var Account = require('./models/account');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var security = require('./utils/security/securityhelper')
// connect db - required the mongo db to be started mongoose
var mongoose = require('mongoose');
if (mongoose.connection.readyState == 0) {
    mongoose.connect(require('./config/config').db.prod);
}

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("We are connected!");
});
// Parse incoming request bodies under the req.body property
var bodyParser = require('body-parser');

//Define the routes
var indexRoutes = require('./routes/index');
var consentRoutes = require('./routes/consent');
var dataRoutes = require('./routes/data');

//here is the magic
// for  authentication
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();
var cors = require("cors");

var originsWhitelist = [
    'http://localhost:3002'       //this is my front-end url for development
];
var corsOptions = {
    origin: function (origin, callback) {
        var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
    }
    , credentials: true
}
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // include before other routes
// app.options('/data/user/:user/item/:itemtitle', cors(corsOptions)); // enable pre-flight request for DELETE request
// app.del('/data/user/:user/item/:itemtitle', cors(corsOptions), function(req, res, next){
//     res.json({msg: 'This is CORS-enabled for all origins!'});
// });
// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('express-session')({
    secret: security.createRandomSymmetricKeyString(),
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false, httpOnly: false}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRoutes);
app.use('/data', dataRoutes);
app.use('/consents', consentRoutes);


// passport config
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: err
    });
});

module.exports = app;
