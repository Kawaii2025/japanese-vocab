# Use Node.js LTS image
FROM node:20

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json for dependencies
COPY api/package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the API source code
COPY api/ ./

# Expose the API server port (change if needed)
EXPOSE 1337

# Start the API
CMD ["node", "server.js"]
