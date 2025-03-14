all: up

prepare:
	@./init.sh
	#@ mkdir -p data/django
	#@ echo "Creating data folder"
build:
	@ docker compose -f srcs/requirements/docker-compose.yml --env-file .env build

up: prepare build
	@ docker compose -f srcs/requirements/docker-compose.yml  --env-file .env -p ft_transcendence up -d

clean:
	-@ docker rm  -f backend #2>/dev/null
	-@ docker rmi backend #2>/dev/null
	# -@ docker volume rm backend #2>/dev/null
	-@ docker rm  -f frontend #2>/dev/null
	-@ docker rmi frontend #2>/dev/null
	# -@ docker volume rm frontend #2>/dev/null
	-@ docker rm  -f postgres #2>/dev/null
	-@ docker rmi postgres #2>/dev/null
	# -@ docker network rm ft_transcendence #2>/dev/null
	# @ docker compose -f srcs/requirements/docker-compose.yml down -v

re: clean all

.PHONY: all prepare build up clean re
