#!/bin/bash

if [ -e drafts.sqlite ] 
then
  rm drafts.sqlite
fi
sqlite3 drafts.sqlite < db.schema
