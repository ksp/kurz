FROM docker.io/node:buster AS jsbuild

RUN mkdir /app
COPY . /app
WORKDIR /app/frontend
RUN npm install && npm run build



FROM mcr.microsoft.com/dotnet/sdk:6.0
COPY --from=jsbuild /app /app
WORKDIR /app/server/Ksp.WebServer
RUN dotnet build


EXPOSE 80
CMD dotnet run --urls http://0.0.0.0:80



