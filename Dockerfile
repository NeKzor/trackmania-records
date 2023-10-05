FROM denoland/deno:alpine-1.37.1 AS server

RUN apk update
RUN apk upgrade

WORKDIR /app
ADD server .

RUN deno cache main.ts

CMD ./entrypoint.sh
