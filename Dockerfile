# ==========================================================
# UMG - Desarrollo Web - Panadería San Carlos
# Imagen para publicar el sistema (Render u otro hosting).
# Etapa 1: compila el proyecto con Maven
# Etapa 2: lo ejecuta en Tomcat 9
# ==========================================================

FROM maven:3.9-eclipse-temurin-8 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline || true
COPY src ./src
RUN mvn -B -q package -DskipTests

FROM tomcat:9.0-jdk17
RUN rm -rf /usr/local/tomcat/webapps/*
# Se publica como ROOT para que el sitio quede en la raíz del dominio
COPY --from=build /app/target/*.war /usr/local/tomcat/webapps/ROOT.war
ENV TZ=America/Guatemala
EXPOSE 8080
# Render indica el puerto en la variable PORT
CMD ["sh", "-c", "sed -i \"s/port=\\\"8080\\\"/port=\\\"${PORT:-8080}\\\"/\" /usr/local/tomcat/conf/server.xml && catalina.sh run"]
