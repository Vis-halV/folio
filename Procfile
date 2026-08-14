web: gunicorn --chdir backend wsgi:app --workers 3 --timeout 60 --access-logfile -
release: bash -c "cd backend && flask db upgrade"
