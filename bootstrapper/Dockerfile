# Use the official Node.js LTS (Long Term Support) Alpine version as the base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY ../*.json ./

# Install dependencies
RUN npm ci

# Copy app
COPY ../. ./src

# Run...
CMD ["node", "src/bootstrapper/index.js"]
