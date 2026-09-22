FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Silpancheria_Gestion/*.csproj ./Silpancheria_Gestion/
RUN dotnet restore ./Silpancheria_Gestion/Silpancheria_Gestion.csproj
COPY . ./
RUN dotnet publish Silpancheria_Gestion/Silpancheria_Gestion.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app ./
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Silpancheria_Gestion.dll"]