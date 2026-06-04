FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Build Java classes
RUN apk add --no-cache openjdk11-jdk maven

RUN cd /app && \
    mvn clean package -DskipTests || true

EXPOSE 5000

CMD ["npm", "start"]
