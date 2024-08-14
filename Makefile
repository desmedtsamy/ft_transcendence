all: up

prepare:
	@./init.sh
	#@ mkdir -p data/django
	#@ echo "Creating data folder"
build:
	@ docker compose -f srcs/requirements/docker-compose.yml build

up: prepare build
	@ docker compose -f srcs/requirements/docker-compose.yml -p ft_transcendence up -d

clean:
	-@ docker rm  -f django #2>/dev/null
	-@ docker rmi django #2>/dev/null
	-@ docker volume rm django #2>/dev/null
	-@ docker network rm ft_transcendence #2>/dev/null
	@ docker compose -f srcs/requirements/docker-compose.yml down -v

re: clean all

.PHONY: all prepare build up clean re
