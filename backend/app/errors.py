"""Uniform JSON error handling."""
from flask import jsonify
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    def __init__(self, message, status_code=400, details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details

    def to_response(self):
        payload = {"error": self.message}
        if self.details:
            payload["details"] = self.details
        return jsonify(payload), self.status_code


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def _api_error(exc):
        return exc.to_response()

    @app.errorhandler(HTTPException)
    def _http_error(exc):
        return jsonify({"error": exc.description}), exc.code

    @app.errorhandler(Exception)
    def _unexpected(exc):
        app.logger.exception("Unhandled error: %s", exc)
        return jsonify({"error": "Internal server error"}), 500
