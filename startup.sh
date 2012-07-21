#!/bin/bash

function check_server () {
  curl -s http://localhost:8080 > /dev/null
  return $?
}

check_server
if [ $? -ne 0 ]
  then
    cd ../../..
    python router.py &

    check_server
    while [ $? -ne 0 ]
    do
      sleep .1
      check_server
    done
fi

open -a Google\ Chrome http://localhost:8080
