# Landing estática de ObraFlow. Sin dependencias: el HTML lleva las
# fotografías empotradas como data URI, así que sólo hay que servirlo.
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY server.js index.html icon.svg ./

EXPOSE 8080
CMD ["node", "server.js"]
