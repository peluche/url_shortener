#!/bin/bash
PORT=5004 node app.js | tee -a log/url_shortener.log
