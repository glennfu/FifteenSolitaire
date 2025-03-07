# Install dependencies
npm install
# Start the development server
npm run dev

# TODO

- [ ] Track number of moves. Should count down when clicking Undo.
- [X] Game should remember current state and Games Won when you refresh the page
- [ ] Make cards animate in a straight line from start position to end position when moving.
- [X] End Game should have a super cool animation for the cards.

# Build standalone version

    npm run build:simple-fix

# Upload to Dreamhost

    ./upload.sh

# All together now

    npm run build:simple-fix && ./upload.sh
