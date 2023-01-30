lint: 
	npx eslint ./src

startserver:
	npm run startserver

build:
	npm run build

runserver-dev:
	make build && make startserver

run-docker:
	docker-compose -f ./docker-compose.yaml up --build

run-docker-dev:
	docker-compose -f ./docker-compose.dev.yaml up --build backend worker