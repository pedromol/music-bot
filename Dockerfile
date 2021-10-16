FROM node:16-bullseye as build
ADD . /appBuild
WORKDIR /appBuild
RUN npm i npm -g && npm i && npm run build

FROM node:16-bullseye
RUN apt update && apt install ffmpeg python3 python-is-python3 python3-pip build-essential libssl-dev libffi-dev python3-dev python3-venv -y
WORKDIR /app
COPY --from=build /appBuild/dist ./dist
COPY --from=build /appBuild/node_modules ./node_modules
COPY --from=build /appBuild/package.json ./package.json
ENTRYPOINT [ "npm", "run", "start:prod" ]