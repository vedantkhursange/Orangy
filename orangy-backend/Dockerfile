# Build Stage — use Java 17 to match pom.xml
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Copy the pom.xml and download dependencies (caches dependencies layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B
# Copy the source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime Stage — lightweight JRE 17
FROM eclipse-temurin:17-jre
WORKDIR /app
# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the port (8080 for Spring Boot)
EXPOSE 8080
# Run the application with dev profile by default (overridden by K8s env var)
ENTRYPOINT ["java", "-jar", "app.jar"]
