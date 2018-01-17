FROM node:latest

RUN mkdir -p /opt/app

ARG NODE_ENV=dev
ENV NODE_ENV $NODE_ENV

ARG PORT=80
ENV PORT $PORT

EXPOSE $PORT 5858 9229

# HEALTHCHECK CMD curl -fs http://localhost:$PORT/healthz || exit 1

WORKDIR /opt
COPY package.json package-lock.json* ./
RUN npm install && npm cache clean --force
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . /opt/app

CMD [ "node", "index.js" ]
