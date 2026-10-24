FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Students.Api.csproj .
RUN dotnet restore Students.Api.csproj

COPY . .
RUN dotnet publish Students.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec dotnet Students.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]