# Gunakan base image resmi Node.js
FROM node:20-alpine

# Set working directory di dalam kontainer
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install dependensi
RUN npm install

# Copy sisa source code
COPY . .

# Expose port yang digunakan oleh Vite
EXPOSE 5173

# Jalankan server development
CMD ["npm", "run", "dev", "--", "--host"]