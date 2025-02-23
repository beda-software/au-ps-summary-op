compose = docker compose

run: build up

pull:
	$(compose) pull

build:
	$(compose) build

up:
	$(compose) up

stop:
	$(compose) stop

down:
	$(compose) down --volumes

build-seeds:
	$(compose) -f docker-compose.seeds.yaml up

clear_restart: stop down build up
