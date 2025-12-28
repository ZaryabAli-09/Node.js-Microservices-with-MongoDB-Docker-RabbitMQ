FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8001

CMD ["node", "index.js"]


# subscriptions of sellers
# signup seller registration 
# rbac role based access 
# courier crud