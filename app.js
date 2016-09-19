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

//cors is necessary for correct parsing of the data from the mongo db
var cors = require("cors");

// for  authentication
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();
app.use(cors());

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
    cookie: {secure: true, httpOnly: true}
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
