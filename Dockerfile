FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --include=optional \
  && node --input-type=module -e 'await import("sharp"); await import("bcrypt")'

COPY --chown=node:node . .

USER node

EXPOSE 3000

CMD [ "npm", "start" ]
