FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Ensure upload directories exist
RUN mkdir -p uploads/images uploads/videos uploads/documents uploads/audio uploads/other

EXPOSE 5000

CMD ["npm", "run", "dev"]
