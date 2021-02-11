FROM node:14

# WORKDIR /app

RUN npm init -y
COPY . .

RUN npm install

CMD [ "node", "index.js" ]