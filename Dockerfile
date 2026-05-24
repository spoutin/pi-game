# Use the official Node.js 20 image
FROM node:20-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Ensure the data directory exists for the leaderboard
RUN mkdir -p data && touch data/scores.json

# Export the port the app runs on
EXPOSE 3000

# Run the web service on container startup.
CMD [ "node", "server.js" ]
