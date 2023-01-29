lint: 
	npx eslint ./src

startserver:
	npm run startserver

build:
	npm run build

runserver-dev:
	make build && make startserver

run-docker:
	docker-compose -f ./docker-compose.yaml up

run-docker-rebuild:
	docker-compose -f ./docker-compose.yaml up --build backend