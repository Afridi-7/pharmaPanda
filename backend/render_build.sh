#!/usr/bin/env bash
# Render build step for the API.
#
# Runs on every deploy, before the service starts. Migrations and the catalogue
# seed both need to happen here: the database Render provisions is empty, and
# `seed_catalogue` is idempotent, so re-running it on each deploy is safe and
# keeps content in step with the code.

set -o errexit  # stop on the first failure rather than starting a broken service

pip install --upgrade pip
pip install -r requirements.txt

alembic upgrade head
python -m scripts.seed_catalogue
