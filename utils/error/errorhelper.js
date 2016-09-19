module.exports = {
    check: function (err) {
        if (err) {
            console.error(err);
            res.status(err.status || 500);
            res.json({
                message: err.message,
                error: err
            });
        }
    }
}