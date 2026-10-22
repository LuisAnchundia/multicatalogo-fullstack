FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/Practica03_ComponentesLayout_React/package.json frontend/Practica03_ComponentesLayout_React/package-lock.json ./
RUN npm ci
COPY frontend/Practica03_ComponentesLayout_React/ ./
RUN npm run build

FROM golang:1.27-alpine AS backend
WORKDIR /backend
COPY backend/multicatalogo-backend/go.mod backend/multicatalogo-backend/go.sum ./
RUN go mod download
COPY backend/multicatalogo-backend/ ./
RUN CGO_ENABLED=0 go build -o /multicatalogo .

FROM alpine:3.22
WORKDIR /app
COPY --from=backend /multicatalogo /usr/local/bin/multicatalogo
COPY --from=frontend /frontend/dist ./dist
EXPOSE 3000
CMD ["multicatalogo"]
