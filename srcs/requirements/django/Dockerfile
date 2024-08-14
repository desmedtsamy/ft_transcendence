FROM python:3.12.3-bookworm

# optimization for Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update -y && apt-get upgrade -y
RUN apt-get install postgresql-client -y
RUN pip install --upgrade pip
WORKDIR /app
COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app/

COPY launch.sh /
RUN chmod +x /launch.sh
CMD [ "/bin/bash", "/launch.sh" ]