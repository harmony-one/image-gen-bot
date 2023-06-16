FROM node:16

WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN npm run build

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 3000 8443

CMD [ "npm", "run", "start" ]