# FROM node:20-alpine   
# using AWS ECR Public nodejs image no docker hub limitations 
FROM public.ecr.aws/nodejs/node:20-alpine 

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["node", "index.js"]
