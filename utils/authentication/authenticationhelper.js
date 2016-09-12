module.exports = {
    /**
     * Checks if the user is authenticated or not.
     *
     * @param req request to the resource
     * @param res response
     * @param next invokes the next middleware functione
     */
    isLoggedIn: function (req, res, next) {
        if (!req.isAuthenticated()) {
            console.log("Not authenticated");
            res.redirect("/login");
        } else {
            next();
        }
    }
}