var config = require('../../config/config');

module.exports = {
    /**
     * Checks if the user is authenticated or not.
     *
     * @param req request to the resource
     * @param res response
     * @param next invokes the next middleware functione
     */
    isLoggedIn: function (req, res, next) {
        console.log("isLoggedIn:" + req.cookies['connect.sid'])

        if (!req.isAuthenticated()) {
            console.log("Not authenticated");
            res.status(401).json({message: "Unauthorized"});
        } else {
            next();
        }
    }
}