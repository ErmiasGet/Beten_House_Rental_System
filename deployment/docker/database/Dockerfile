FROM postgres:16-alpine

ENV POSTGRES_DB=betora_db
ENV POSTGRES_USER=betora_user
ENV POSTGRES_PASSWORD=betora_pass

COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

CMD ["postgres"]
