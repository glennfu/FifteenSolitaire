   #!/bin/bash

   # Variables
   USER="glennfuadmin"
   DOMAIN="gamelizard.com"
   LOCAL_FILE="dist-standalone/fifteen-solitaire.html"
   REMOTE_PATH="/home/$USER/$DOMAIN"

   # Upload the file using scp
   scp $LOCAL_FILE $USER@$DOMAIN:$REMOTE_PATH/fifteen-solitaire.html