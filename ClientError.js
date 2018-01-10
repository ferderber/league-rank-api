module.exports = class ClientError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
    }
    getResponse() {
        return {
            status: this.statusCode,
            body: {message: this.message}
        };
    }
}