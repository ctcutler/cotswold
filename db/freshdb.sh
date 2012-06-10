#!/bin/bash

rm drafts.sqlite
sqlite3 drafts.sqlite < db.schema
