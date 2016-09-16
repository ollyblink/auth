var express = require('express');
var Account = require('./models/account');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var security = require('./utils/security/securityhelper')
var db = require('./models/db').getDB(require('./config/config').db.prod);

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
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
