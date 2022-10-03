FROM node:16-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY ./ ./

RUN chown -R node:0 /usr/src/app && \
    chmod -R g=u /usr/src/app

FROM node:16-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app /usr/src/app

USER node

EXPOSE 3000

CMD ["npm", "start"]