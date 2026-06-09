#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp | grep -q ":3000 "; then
    echo "[$(date)] Starting Next.js..." >> /home/z/my-project/watchdog.log
    node node_modules/.bin/next dev -p 3000 -H 0.0.0.0 > /home/z/my-project/dev.log 2>&1 &
    NEXT_PID=$!
    sleep 8
    echo "[$(date)] Started PID $NEXT_PID" >> /home/z/my-project/watchdog.log
  fi
  sleep 5
done
