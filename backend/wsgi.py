"""WSGI entrypoint used by gunicorn on Heroku."""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
