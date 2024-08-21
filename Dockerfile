FROM node:20

ENV NODE_ENV=development

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD [ "npm", "start" ]
