# Use Node.js LTS image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to workdir
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy everything else (API source code)
COPY . .

# Expose API port (change if needed)
EXPOSE 1337

# Start the API (change 'server.js' if your entry file is different)
CMD ["node", "server.js"]
